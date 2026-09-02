import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IMentorshipRequest extends Document {
  _id: mongoose.Types.ObjectId;
  requesterId: mongoose.Types.ObjectId;
  mentorId: mongoose.Types.ObjectId;
  message: string;
  reason: string;
  topic: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
}

const MentorshipRequestSchema = new Schema<IMentorshipRequest>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mentorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    message: { type: String, required: true },
    reason: { type: String, required: true },
    topic: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

export const MentorshipRequestModel: Model<IMentorshipRequest> =
  mongoose.models.MentorshipRequest ||
  mongoose.model<IMentorshipRequest>("MentorshipRequest", MentorshipRequestSchema, "amrita_mentorship_requests");
