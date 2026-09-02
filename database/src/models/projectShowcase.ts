import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IProjectShowcaseComment {
  _id?: mongoose.Types.ObjectId;
  id?: string;
  authorId: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
}

export interface IProjectShowcase extends Document {
  _id: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  teamMembers: mongoose.Types.ObjectId[];
  title: string;
  tagline: string;
  description: string;
  category: "AI / ML" | "Web & Mobile" | "Robotics / IoT" | "Cyber Security" | "Healthcare Tech" | "Blockchain" | "Open Source";
  techStack: string[];
  campus: string;
  department: string;
  githubUrl?: string;
  liveDemoUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  award?: string;
  upvotes: mongoose.Types.ObjectId[];
  comments: IProjectShowcaseComment[];
  createdAt: Date;
}

const ProjectShowcaseCommentSchema = new Schema<IProjectShowcaseComment>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ProjectShowcaseSchema = new Schema<IProjectShowcase>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teamMembers: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
    title: { type: String, required: true, trim: true },
    tagline: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["AI / ML", "Web & Mobile", "Robotics / IoT", "Cyber Security", "Healthcare Tech", "Blockchain", "Open Source"],
      default: "AI / ML",
      index: true,
    },
    techStack: { type: [String], default: [] },
    campus: { type: String, required: true, index: true },
    department: { type: String, required: true },
    githubUrl: { type: String, trim: true },
    liveDemoUrl: { type: String, trim: true },
    videoUrl: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    award: { type: String, trim: true },
    upvotes: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
    comments: { type: [ProjectShowcaseCommentSchema], default: [] },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

export const ProjectShowcaseModel: Model<IProjectShowcase> =
  mongoose.models.ProjectShowcase ||
  mongoose.model<IProjectShowcase>("ProjectShowcase", ProjectShowcaseSchema, "amrita_project_showcases");
