import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  content: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

MessageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });
MessageSchema.index({ recipientId: 1, senderId: 1, createdAt: -1 });
MessageSchema.index({ recipientId: 1, read: 1 });

export const MessageModel: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
