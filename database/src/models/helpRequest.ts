import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IHelpReply {
  _id?: mongoose.Types.ObjectId;
  id?: string;
  authorId: mongoose.Types.ObjectId;
  text: string;
  isSolution: boolean;
  upvotes: mongoose.Types.ObjectId[];
  createdAt: Date;
}

export interface IHelpRequest extends Document {
  _id: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: "Academic" | "Project / Coding" | "Hackathon" | "Placements / Career" | "Campus Life" | "General";
  urgency: "Normal" | "High" | "Urgent";
  tags: string[];
  status: "open" | "solved";
  campus: string;
  department: string;
  solvedByReplyId?: string;
  replies: IHelpReply[];
  upvotes: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const HelpReplySchema = new Schema<IHelpReply>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    isSolution: { type: Boolean, default: false },
    upvotes: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const HelpRequestSchema = new Schema<IHelpRequest>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["Academic", "Project / Coding", "Hackathon", "Placements / Career", "Campus Life", "General"],
      default: "Academic",
      index: true,
    },
    urgency: {
      type: String,
      enum: ["Normal", "High", "Urgent"],
      default: "Normal",
    },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["open", "solved"],
      default: "open",
      index: true,
    },
    campus: { type: String, required: true },
    department: { type: String, required: true },
    solvedByReplyId: { type: String },
    replies: { type: [HelpReplySchema], default: [] },
    upvotes: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

export const HelpRequestModel: Model<IHelpRequest> =
  mongoose.models.HelpRequest ||
  mongoose.model<IHelpRequest>("HelpRequest", HelpRequestSchema, "amrita_help_requests");
