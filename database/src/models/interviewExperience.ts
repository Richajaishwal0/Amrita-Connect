import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IInterviewRound {
  roundNumber: number;
  roundName: string;
  description: string;
  durationMinutes?: number;
}

export interface IInterviewExperience extends Document {
  _id: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  company: string;
  role: string;
  employmentType: "Full-time" | "Internship" | "6-Month Co-op";
  batch?: number;
  campus: string;
  outcome: "Offered" | "Not Selected" | "In Progress" | "Declined Offer";
  difficulty: "Easy" | "Medium" | "Hard" | "Challenging";
  interviewDate: string;
  rounds: IInterviewRound[];
  keyTopics: string[];
  overallExperience: string;
  prepAdvice: string;
  likes: mongoose.Types.ObjectId[];
  savedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const InterviewRoundSchema = new Schema<IInterviewRound>(
  {
    roundNumber: { type: Number, required: true },
    roundName: { type: String, required: true },
    description: { type: String, required: true },
    durationMinutes: { type: Number, default: 45 },
  },
  { _id: false }
);

const InterviewExperienceSchema = new Schema<IInterviewExperience>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    company: { type: String, required: true, trim: true, index: true },
    role: { type: String, required: true, trim: true },
    employmentType: {
      type: String,
      enum: ["Full-time", "Internship", "6-Month Co-op"],
      default: "Full-time",
    },
    batch: { type: Number },
    campus: { type: String, required: true },
    outcome: {
      type: String,
      enum: ["Offered", "Not Selected", "In Progress", "Declined Offer"],
      default: "Offered",
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "Challenging"],
      default: "Medium",
    },
    interviewDate: { type: String, required: true },
    rounds: { type: [InterviewRoundSchema], default: [] },
    keyTopics: { type: [String], default: [] },
    overallExperience: { type: String, required: true },
    prepAdvice: { type: String, required: true },
    likes: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
    savedBy: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

export const InterviewExperienceModel: Model<IInterviewExperience> =
  mongoose.models.InterviewExperience ||
  mongoose.model<IInterviewExperience>(
    "InterviewExperience",
    InterviewExperienceSchema,
    "amrita_interview_experiences"
  );
