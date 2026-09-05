import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IMentorshipRequest extends Document {
  _id: mongoose.Types.ObjectId;
  requesterId: mongoose.Types.ObjectId;
  mentorId: mongoose.Types.ObjectId;
  message: string;
  reason: string;
  topic: string;
  status: "pending" | "accepted" | "rejected";
  bookedDate?: string | null;
  bookedTime?: string | null;
  meetingPlatform?: string | null;
  meetingLink?: string | null;
  note?: string | null;
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
    bookedDate: { type: String, default: null },
    bookedTime: { type: String, default: null },
    meetingPlatform: { type: String, default: null },
    meetingLink: { type: String, default: null },
    note: { type: String, default: null },
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
