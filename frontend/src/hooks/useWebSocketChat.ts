import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface WSMessagePayload {
  type:
    | 'ping'
    | 'pong'
    | 'auth_success'
    | 'online_users'
    | 'user_status'
    | 'send_message'
    | 'new_message'
    | 'delete_message'
    | 'message_deleted'
    | 'typing'
    | 'mark_read'
    | 'messages_read'
    | 'add_reaction'
    | 'reaction_updated';
  data?: any;
}

export function useWebSocketChat(activeRecipientId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<any>(null);

  const connect = useCallback(() => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('amrita_token') : null;
    if (!token) return;

    // Determine WS URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload: WSMessagePayload = JSON.parse(event.data);

          if (payload.type === 'auth_success') {
            if (Array.isArray(payload.data?.onlineUsers)) {
              setOnlineUsers(new Set(payload.data.onlineUsers.map(String)));
            }
          } else if (payload.type === 'user_status') {
            const { userId, isOnline } = payload.data || {};
            if (userId) {
              setOnlineUsers((prev) => {
                const next = new Set(prev);
                if (isOnline) {
                  next.add(String(userId));
                } else {
                  next.delete(String(userId));
                }
                return next;
              });
            }
          } else if (payload.type === 'typing') {
            const { senderId, isTyping } = payload.data || {};
            if (senderId) {
              setTypingMap((prev) => ({
                ...prev,
                [String(senderId)]: !!isTyping,
              }));
              // Auto-clear typing status after 4 seconds
              if (isTyping) {
                setTimeout(() => {
                  setTypingMap((prev) => ({
                    ...prev,
                    [String(senderId)]: false,
                  }));
                }, 4000);
              }
            }
          } else if (payload.type === 'new_message') {
            const msg = payload.data?.message;
            if (msg) {
              // Target thread query key
              const otherId = msg.isMine ? msg.recipientId : msg.senderId;
              const threadKey = ['messages', 'thread', otherId];

              queryClient.setQueryData(threadKey, (oldData: any) => {
                if (!oldData) return oldData;
                const existing = oldData.messages || [];
                if (existing.some((m: any) => m.id === msg.id)) return oldData;
                return {
                  ...oldData,
                  messages: [...existing, msg],
                };
              });

              // Also refresh conversations preview and unread counters
              queryClient.invalidateQueries({ queryKey: ['messages'] });
            }
          } else if (payload.type === 'message_deleted') {
            const { messageId, isDeletedForEveryone, recipientId, senderId } = payload.data || {};
            if (messageId) {
              try {
                if (isDeletedForEveryone) {
                  const raw = localStorage.getItem('amrita_deleted_for_everyone');
                  const set = raw ? new Set(JSON.parse(raw)) : new Set();
                  set.add(messageId);
                  localStorage.setItem('amrita_deleted_for_everyone', JSON.stringify(Array.from(set)));
                } else {
                  const raw = localStorage.getItem('amrita_deleted_for_me');
                  const set = raw ? new Set(JSON.parse(raw)) : new Set();
                  set.add(messageId);
                  localStorage.setItem('amrita_deleted_for_me', JSON.stringify(Array.from(set)));
                }
              } catch {
                // ignore
              }

              const otherId = activeRecipientId || recipientId || senderId;
              if (otherId) {
                const threadKey = ['messages', 'thread', String(otherId)];
                queryClient.setQueryData(threadKey, (oldData: any) => {
                  if (!oldData) return oldData;
                  if (isDeletedForEveryone) {
                    return {
                      ...oldData,
                      messages: (oldData.messages || []).map((m: any) =>
                        m.id === messageId
                          ? {
                              ...m,
                              isDeletedForEveryone: true,
                              content: 'This message was deleted',
                              imageUrl: null,
                              linkUrl: null,
                            }
                          : m
                      ),
                    };
                  }
                  return {
                    ...oldData,
                    messages: (oldData.messages || []).filter((m: any) => m.id !== messageId),
                  };
                });
              }
              queryClient.invalidateQueries({ queryKey: ['messages'] });
            }
          } else if (payload.type === 'messages_read') {
            const { readerId } = payload.data || {};
            if (readerId) {
              const threadKey = ['messages', 'thread', String(readerId)];
              queryClient.setQueryData(threadKey, (oldData: any) => {
                if (!oldData) return oldData;
                return {
                  ...oldData,
                  messages: (oldData.messages || []).map((m: any) => ({
                    ...m,
                    read: true,
                  })),
                };
              });
              queryClient.invalidateQueries({ queryKey: ['messages'] });
            }
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // ignore
    }
  }, [queryClient, activeRecipientId]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const sendDirectMessage = useCallback(
    (
      recipientId: string,
      content: string,
      imageUrl?: string | null,
      linkUrl?: string | null,
      fileUrl?: string | null,
      fileName?: string | null,
      fileSize?: number | null,
      fileType?: string | null
    ) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'send_message',
            data: {
              recipientId,
              content,
              imageUrl: imageUrl || null,
              linkUrl: linkUrl || null,
              fileUrl: fileUrl || null,
              fileName: fileName || null,
              fileSize: fileSize || null,
              fileType: fileType || null,
            },
          })
        );
      }
    },
    []
  );

  const deleteDirectMessage = useCallback(
    (messageId: string, mode: 'for_me' | 'for_everyone') => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'delete_message',
            data: { messageId, mode },
          })
        );
      }
    },
    []
  );

  const sendTyping = useCallback((recipientId: string, isTyping: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'typing',
          data: { recipientId, isTyping },
        })
      );
    }
  }, []);

  const markAsRead = useCallback((recipientId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'mark_read',
          data: { recipientId },
        })
      );
    }
  }, []);

  return {
    isConnected,
    onlineUsers,
    typingMap,
    sendDirectMessage,
    deleteDirectMessage,
    sendTyping,
    markAsRead,
  };
}
