import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IResearchApplication {
  _id?: mongoose.Types.ObjectId;
  id?: string;
  applicantId: mongoose.Types.ObjectId;
  roleAppliedFor?: string;
  statementOfInterest: string;
  relevantSkills: string[];
  status: "pending" | "accepted" | "declined";
  appliedAt: Date;
}

export interface IOpenPosition {
  roleTitle: string;
  spots: number;
  prerequisites: string[];
}

export interface IPublication {
  title: string;
  venue: string;
  link?: string;
}

export interface IResearchProject extends Document {
  _id: mongoose.Types.ObjectId;
  principalInvestigatorId: mongoose.Types.ObjectId;
  coInvestigators: mongoose.Types.ObjectId[];
  title: string;
  labName: string;
  fundingSource?: string;
  campus: string;
  department: string;
  category:
    | "Artificial Intelligence"
    | "Robotics & IoT"
    | "Biotechnology & Healthcare"
    | "Cyber Security"
    | "Sustainable Energy"
    | "Computational Systems"
    | "Interdisciplinary";
  abstract: string;
  objectives: string[];
  openPositions: IOpenPosition[];
  publications: IPublication[];
  status: "recruiting" | "active" | "completed";
  applications: IResearchApplication[];
  bookmarks: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const ResearchApplicationSchema = new Schema<IResearchApplication>(
  {
    applicantId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roleAppliedFor: { type: String, default: "Research Assistant" },
    statementOfInterest: { type: String, required: true },
    relevantSkills: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    appliedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const OpenPositionSchema = new Schema<IOpenPosition>(
  {
    roleTitle: { type: String, required: true },
    spots: { type: Number, default: 1 },
    prerequisites: { type: [String], default: [] },
  },
  { _id: false }
);

const PublicationSchema = new Schema<IPublication>(
  {
    title: { type: String, required: true },
    venue: { type: String, required: true },
    link: { type: String },
  },
  { _id: false }
);

const ResearchProjectSchema = new Schema<IResearchProject>(
  {
    principalInvestigatorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    coInvestigators: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
    title: { type: String, required: true, trim: true },
    labName: { type: String, required: true, trim: true },
    fundingSource: { type: String, trim: true },
    campus: { type: String, required: true, index: true },
    department: { type: String, required: true, index: true },
    category: {
      type: String,
      enum: [
        "Artificial Intelligence",
        "Robotics & IoT",
        "Biotechnology & Healthcare",
        "Cyber Security",
        "Sustainable Energy",
        "Computational Systems",
        "Interdisciplinary",
      ],
      default: "Artificial Intelligence",
      index: true,
    },
    abstract: { type: String, required: true },
    objectives: { type: [String], default: [] },
    openPositions: { type: [OpenPositionSchema], default: [] },
    publications: { type: [PublicationSchema], default: [] },
    status: {
      type: String,
      enum: ["recruiting", "active", "completed"],
      default: "recruiting",
      index: true,
    },
    applications: { type: [ResearchApplicationSchema], default: [] },
    bookmarks: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

export const ResearchProjectModel: Model<IResearchProject> =
  mongoose.models.ResearchProject ||
  mongoose.model<IResearchProject>("ResearchProject", ResearchProjectSchema, "amrita_research_projects");
