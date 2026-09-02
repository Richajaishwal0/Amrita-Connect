import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IConnection extends Document {
  _id: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
  message?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ConnectionSchema = new Schema<IConnection>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      index: true,
    },
    message: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

ConnectionSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });
ConnectionSchema.index({ receiverId: 1, status: 1 });
ConnectionSchema.index({ senderId: 1, status: 1 });

export const ConnectionModel: Model<IConnection> =
  mongoose.models.Connection || mongoose.model<IConnection>("Connection", ConnectionSchema);
