import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IFlagshipEvent extends Document {
  _id: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  title: string;
  tagline: string;
  category: string;
  targetDate: Date;
  campus: string;
  highlight: string;
  tag: string;
  badgeBg?: string;
  linkUrl?: string | null;
  isActive: boolean;
  order: number;
  createdAt: Date;
}

const FlagshipEventSchema = new Schema<IFlagshipEvent>(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
    title: { type: String, required: true, trim: true },
    tagline: { type: String, required: true, trim: true },
    category: { type: String, required: true, default: "Hackathon" },
    targetDate: { type: Date, required: true, index: true },
    campus: { type: String, required: true, default: "All Campuses" },
    highlight: { type: String, required: true, default: "National Flagship" },
    tag: { type: String, required: true, default: "#Events" },
    badgeBg: { type: String, default: "" },
    linkUrl: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

export const FlagshipEventModel: Model<IFlagshipEvent> =
  mongoose.models.FlagshipEvent ||
  mongoose.model<IFlagshipEvent>("FlagshipEvent", FlagshipEventSchema, "amrita_flagship_events");
