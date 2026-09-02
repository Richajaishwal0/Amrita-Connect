import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ICollaborationMember {
  userId: mongoose.Types.ObjectId;
  role: string;
  joinedAt: Date;
}

export interface ICollaborationApplication {
  _id?: mongoose.Types.ObjectId;
  id?: string;
  userId: mongoose.Types.ObjectId;
  role: string;
  pitch: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
}

export interface ICollaboration extends Document {
  _id: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  requiredSkills: string[];
  rolesNeeded: string[];
  teamSize: number;
  deadline: string;
  category: string;
  status: "open" | "closed" | "completed";
  memberCount: number;
  members: ICollaborationMember[];
  applications: ICollaborationApplication[];
  createdAt: Date;
}

const CollaborationMemberSchema = new Schema<ICollaborationMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true, default: "Team Member" },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CollaborationApplicationSchema = new Schema<ICollaborationApplication>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true, default: "Contributor" },
    pitch: { type: String, required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const CollaborationSchema = new Schema<ICollaboration>(
  {
    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    requiredSkills: { type: [String], default: [] },
    rolesNeeded: { type: [String], default: [] },
    teamSize: { type: Number, required: true },
    deadline: { type: String, required: true },
    category: { type: String, required: true, index: true },
    status: { type: String, enum: ["open", "closed", "completed"], default: "open", index: true },
    memberCount: { type: Number, default: 1 },
    members: { type: [CollaborationMemberSchema], default: [] },
    applications: { type: [CollaborationApplicationSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

export const CollaborationModel: Model<ICollaboration> =
  mongoose.models.Collaboration ||
  mongoose.model<ICollaboration>("Collaboration", CollaborationSchema, "amrita_collaborations");
