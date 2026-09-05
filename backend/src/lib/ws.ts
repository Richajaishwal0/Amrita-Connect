import type { IncomingMessage, Server as HttpServer } from "node:http";
import type { Socket } from "node:net";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { MessageModel, UserModel } from "@workspace/db";
import { logger } from "./logger";

const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const JWT_SECRET = process.env.JWT_SECRET || "amrita_connect_secret_key_2025";

export interface WSMessagePayload {
  type:
    | "ping"
    | "pong"
    | "auth_success"
    | "online_users"
    | "user_status"
    | "send_message"
    | "new_message"
    | "typing"
    | "mark_read"
    | "messages_read"
    | "add_reaction"
    | "reaction_updated";
  data?: any;
}

export class WSClient {
  public socket: Socket;
  public userId: string;
  public user?: { id: string; fullName: string; role: string; campus: string };
  private buffer: Buffer = Buffer.alloc(0);

  constructor(socket: Socket, userId: string, user?: any) {
    this.socket = socket;
    this.userId = userId;
    this.user = user;

    this.socket.on("data", (chunk: Buffer) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      this.processBuffer();
    });

    this.socket.on("error", (err) => {
      logger.debug({ err: err.message, userId: this.userId }, "WS socket error");
    });
  }

  public send(payload: WSMessagePayload) {
    if (this.socket.destroyed || !this.socket.writable) return;
    try {
      const json = JSON.stringify(payload);
      const frame = encodeFrame(json);
      this.socket.write(frame);
    } catch (err: any) {
      logger.debug({ err: err.message }, "Failed to write WS frame");
    }
  }

  public close() {
    try {
      if (!this.socket.destroyed) {
        // Send close frame 0x88
        this.socket.write(Buffer.from([0x88, 0x00]));
        this.socket.end();
      }
    } catch {
      // ignore
    }
  }

  private processBuffer() {
    while (this.buffer.length >= 2) {
      const firstByte = this.buffer[0];
      const secondByte = this.buffer[1];

      const fin = (firstByte & 0x80) === 0x80;
      const opcode = firstByte & 0x0f;
      const isMasked = (secondByte & 0x80) === 0x80;
      let payloadLength = secondByte & 0x7f;
      let offset = 2;

      if (payloadLength === 126) {
        if (this.buffer.length < 4) return;
        payloadLength = this.buffer.readUInt16BE(2);
        offset = 4;
      } else if (payloadLength === 127) {
        if (this.buffer.length < 10) return;
        payloadLength = Number(this.buffer.readBigUInt64BE(2));
        offset = 10;
      }

      const maskLength = isMasked ? 4 : 0;
      const totalFrameLength = offset + maskLength + payloadLength;

      if (this.buffer.length < totalFrameLength) {
        // Waiting for more chunks
        return;
      }

      let maskKey: Buffer | null = null;
      if (isMasked) {
        maskKey = this.buffer.subarray(offset, offset + 4);
        offset += 4;
      }

      const rawPayload = this.buffer.subarray(offset, offset + payloadLength);
      const payload = Buffer.alloc(payloadLength);

      if (isMasked && maskKey) {
        for (let i = 0; i < payloadLength; i++) {
          payload[i] = rawPayload[i] ^ maskKey[i % 4];
        }
      } else {
        rawPayload.copy(payload);
      }

      // Advance buffer
      this.buffer = this.buffer.subarray(totalFrameLength);

      // Handle Opcode
      if (opcode === 0x08) {
        // Close frame
        this.close();
        return;
      } else if (opcode === 0x09) {
        // Ping -> Reply with Pong (0x0a)
        if (!this.socket.destroyed) {
          const pongFrame = Buffer.from([0x8a, 0x00]);
          this.socket.write(pongFrame);
        }
      } else if (opcode === 0x0a) {
        // Pong received
      } else if (opcode === 0x01) {
        // Text frame
        try {
          const text = payload.toString("utf8");
          const parsed = JSON.parse(text);
          wsManager.handleClientMessage(this, parsed);
        } catch (err: any) {
          logger.debug({ err: err.message }, "Invalid JSON from WS client");
        }
      }
    }
  }
}

function encodeFrame(text: string): Buffer {
  const payload = Buffer.from(text, "utf8");
  const length = payload.length;

  let header: Buffer;
  if (length <= 125) {
    header = Buffer.alloc(2);
    header[0] = 0x81; // FIN + Text opcode
    header[1] = length;
  } else if (length <= 65535) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }

  return Buffer.concat([header, payload]);
}

class WebSocketManager {
  private userSockets: Map<string, Set<WSClient>> = new Map();

  public init(server: HttpServer) {
    server.on("upgrade", (req: IncomingMessage, socket: Socket, head: Buffer) => {
      this.handleUpgrade(req, socket, head);
    });

    // Clean heartbeat interval
    setInterval(() => {
      this.broadcastPing();
    }, 30000);
  }

  private handleUpgrade(req: IncomingMessage, socket: Socket, head: Buffer) {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    
    // Only accept /ws or /api/ws path
    if (url.pathname !== "/ws" && url.pathname !== "/api/ws") {
      socket.destroy();
      return;
    }

    const secKey = req.headers["sec-websocket-key"];
    if (!secKey || typeof secKey !== "string") {
      socket.destroy();
      return;
    }

    // Authenticate via token query param or authorization header
    let token = url.searchParams.get("token");
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.slice(7).trim();
    }

    if (!token) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    const userId = decoded.userId || decoded.id;
    if (!userId) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    // Complete WebSocket Handshake
    const acceptKey = crypto
      .createHash("sha1")
      .update(secKey + WS_GUID)
      .digest("base64");

    const responseHeaders = [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${acceptKey}`,
      "\r\n",
    ].join("\r\n");

    socket.write(responseHeaders);

    const client = new WSClient(socket, userId.toString());
    this.addClient(client);

    socket.on("close", () => {
      this.removeClient(client);
    });

    // Send auth success and current online users list
    client.send({
      type: "auth_success",
      data: { userId, onlineUsers: this.getOnlineUserIds() },
    });

    // Broadcast online presence
    this.broadcastUserStatus(userId, true);
  }

  public addClient(client: WSClient) {
    const existing = this.userSockets.get(client.userId) || new Set();
    existing.add(client);
    this.userSockets.set(client.userId, existing);
  }

  public removeClient(client: WSClient) {
    const existing = this.userSockets.get(client.userId);
    if (existing) {
      existing.delete(client);
      if (existing.size === 0) {
        this.userSockets.delete(client.userId);
        this.broadcastUserStatus(client.userId, false);
      }
    }
  }

  public getOnlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }

  public isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.size > 0;
  }

  public sendToUser(userId: string, payload: WSMessagePayload) {
    const sockets = this.userSockets.get(userId.toString());
    if (sockets) {
      for (const client of sockets) {
        client.send(payload);
      }
    }
  }

  public broadcast(payload: WSMessagePayload, excludeUserId?: string) {
    for (const [userId, sockets] of this.userSockets.entries()) {
      if (excludeUserId && userId === excludeUserId) continue;
      for (const client of sockets) {
        client.send(payload);
      }
    }
  }

  private broadcastPing() {
    for (const sockets of this.userSockets.values()) {
      for (const client of sockets) {
        client.send({ type: "ping" });
      }
    }
  }

  private broadcastUserStatus(userId: string, isOnline: boolean) {
    this.broadcast({
      type: "user_status",
      data: { userId, isOnline, timestamp: new Date().toISOString() },
    });
  }

  public async handleClientMessage(client: WSClient, payload: WSMessagePayload) {
    const { type, data } = payload;

    switch (type) {
      case "ping":
        client.send({ type: "pong" });
        break;

      case "typing": {
        // data: { recipientId: string, isTyping: boolean }
        if (data?.recipientId) {
          this.sendToUser(data.recipientId, {
            type: "typing",
            data: {
              senderId: client.userId,
              isTyping: !!data.isTyping,
            },
          });
        }
        break;
      }

      case "mark_read": {
        // data: { recipientId: string, messageIds?: string[] }
        if (data?.recipientId) {
          try {
            await MessageModel.updateMany(
              {
                senderId: data.recipientId,
                recipientId: client.userId,
                read: false,
              },
              { $set: { read: true } }
            );

            // Notify original sender that their messages were read
            this.sendToUser(data.recipientId, {
              type: "messages_read",
              data: {
                readerId: client.userId,
                readAt: new Date().toISOString(),
              },
            });
          } catch (err: any) {
            logger.error({ err: err.message }, "Error updating read status in WS");
          }
        }
        break;
      }

      case "send_message": {
        // data: { recipientId: string, content?: string, imageUrl?: string, linkUrl?: string, fileUrl?: string, fileName?: string, fileSize?: number, fileType?: string }
        const trimmedContent = typeof data?.content === "string" ? data.content.trim() : "";
        const cleanImageUrl = typeof data?.imageUrl === "string" && data.imageUrl.trim() ? data.imageUrl.trim() : null;
        const cleanLinkUrl = typeof data?.linkUrl === "string" && data.linkUrl.trim() ? data.linkUrl.trim() : null;
        const cleanFileUrl = typeof data?.fileUrl === "string" && data.fileUrl.trim() ? data.fileUrl.trim() : null;
        const cleanFileName = typeof data?.fileName === "string" && data.fileName.trim() ? data.fileName.trim() : null;
        const cleanFileType = typeof data?.fileType === "string" && data.fileType.trim() ? data.fileType.trim() : null;
        const cleanFileSize = typeof data?.fileSize === "number" && Number.isFinite(data.fileSize) ? data.fileSize : null;

        if (!data?.recipientId || (!trimmedContent && !cleanImageUrl && !cleanLinkUrl && !cleanFileUrl)) return;

        // Security validation on file attachments
        if (cleanFileName) {
          const dangerousExtRegex = /\.(exe|bat|cmd|sh|bin|msi|vbs|wsf|scr|com|pif)$/i;
          if (dangerousExtRegex.test(cleanFileName)) {
            client.send({
              type: "error" as any,
              data: { message: "Executable and script attachments are not permitted.", recipientId: data.recipientId },
            });
            return;
          }
        }

        if (cleanFileSize && cleanFileSize > 15 * 1024 * 1024) {
          client.send({
            type: "error" as any,
            data: { message: "File attachment exceeds maximum limit of 15MB.", recipientId: data.recipientId },
          });
          return;
        }

        // Prevent messaging self
        if (client.userId === data.recipientId) {
          client.send({
            type: "error" as any,
            data: { message: "You cannot message yourself.", recipientId: data.recipientId },
          });
          return;
        }

        try {
          // Strict Connection Authorization: Verify users have an accepted connection
          const isConnected = await ConnectionModel.findOne({
            $or: [
              { senderId: client.userId, receiverId: data.recipientId, status: "accepted" },
              { senderId: data.recipientId, receiverId: client.userId, status: "accepted" },
            ],
          }).lean();

          if (!isConnected) {
            logger.warn(
              { senderId: client.userId, recipientId: data.recipientId },
              "Blocked WS direct message: Users are not connected"
            );
            client.send({
              type: "error" as any,
              data: {
                message: "You must be connected with this user before sending messages.",
                recipientId: data.recipientId,
              },
            });
            return;
          }

          const newMsg = await MessageModel.create({
            senderId: client.userId,
            recipientId: data.recipientId,
            content: trimmedContent,
            imageUrl: cleanImageUrl,
            fileUrl: cleanFileUrl,
            fileName: cleanFileName,
            fileSize: cleanFileSize,
            fileType: cleanFileType,
            linkUrl: cleanLinkUrl,
            deletedFor: [],
            isDeletedForEveryone: false,
            read: false,
          });

          const [sender, recipient] = await Promise.all([
            UserModel.findById(client.userId).lean(),
            UserModel.findById(data.recipientId).lean(),
          ]);

          const formattedMessage = {
            id: newMsg._id.toString(),
            senderId: newMsg.senderId.toString(),
            recipientId: newMsg.recipientId.toString(),
            content: newMsg.content,
            imageUrl: newMsg.imageUrl,
            fileUrl: (newMsg as any).fileUrl,
            fileName: (newMsg as any).fileName,
            fileSize: (newMsg as any).fileSize,
            fileType: (newMsg as any).fileType,
            linkUrl: newMsg.linkUrl,
            isDeletedForEveryone: false,
            read: newMsg.read,
            createdAt: newMsg.createdAt.toISOString(),
            updatedAt: newMsg.updatedAt.toISOString(),
            isMine: false,
            sender: sender
              ? {
                  id: sender._id.toString(),
                  fullName: sender.fullName,
                  campus: sender.campus,
                  role: sender.role,
                  department: sender.department,
                  avatarUrl: sender.avatarUrl,
                }
              : undefined,
          };

          // Send to recipient
          this.sendToUser(data.recipientId, {
            type: "new_message",
            data: { message: formattedMessage },
          });

          // Send ACK back to sender with isMine: true
          client.send({
            type: "new_message",
            data: {
              message: { ...formattedMessage, isMine: true },
            },
          });
        } catch (err: any) {
          logger.error({ err: err.message }, "Failed to persist WS message");
        }
        break;
      }

      case "delete_message": {
        // data: { messageId: string, mode: 'for_me' | 'for_everyone' }
        if (!data?.messageId) return;
        try {
          const message = await MessageModel.findById(data.messageId);
          if (!message) return;

          const isSender = message.senderId.toString() === client.userId;
          const isRecipient = message.recipientId.toString() === client.userId;
          if (!isSender && !isRecipient) return;

          if (data.mode === "for_everyone" && isSender) {
            message.isDeletedForEveryone = true;
            message.content = "This message was deleted";
            message.imageUrl = null;
            message.linkUrl = null;
            await message.save();

            const recipientId = message.recipientId.toString();

            this.sendToUser(recipientId, {
              type: "message_deleted",
              data: {
                messageId: data.messageId,
                isDeletedForEveryone: true,
                recipientId,
                senderId: client.userId,
              },
            });

            this.sendToUser(client.userId, {
              type: "message_deleted",
              data: {
                messageId: data.messageId,
                isDeletedForEveryone: true,
                recipientId,
                senderId: client.userId,
              },
            });
          } else {
            // Delete for me
            await MessageModel.findByIdAndUpdate(data.messageId, {
              $addToSet: { deletedFor: client.userId },
            });
            client.send({
              type: "message_deleted",
              data: {
                messageId: data.messageId,
                isDeletedForEveryone: false,
                recipientId: message.recipientId.toString(),
                senderId: message.senderId.toString(),
              },
            });
          }
        } catch (err: any) {
          logger.error({ err: err.message }, "Failed to delete WS message");
        }
        break;
      }
    }
  }
}

export const wsManager = new WebSocketManager();
