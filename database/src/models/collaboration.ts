import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ICollaboration extends Document {
  _id: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  requiredSkills: string[];
  teamSize: number;
  deadline: string;
  category: string;
  memberCount: number;
  createdAt: Date;
}

const CollaborationSchema = new Schema<ICollaboration>(
  {
    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    requiredSkills: { type: [String], default: [] },
    teamSize: { type: Number, required: true },
    deadline: { type: String, required: true },
    category: { type: String, required: true, index: true },
    memberCount: { type: Number, default: 1 },
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
