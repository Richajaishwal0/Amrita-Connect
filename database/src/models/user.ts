import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IUserExperience {
  title?: string;
  company?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface IUserEducation {
  school?: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
  grade?: string;
  activities?: string;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  handle?: string | null;
  passwordHash?: string;
  firebaseUid?: string | null;
  role: "student" | "alumni" | "faculty" | "researcher" | "admin";
  campus: string;
  department: string;
  graduationYear?: number | null;
  headline: string;
  bio: string;
  company?: string | null;
  jobRole?: string | null;
  skills: string[];
  interests: string[];
  helpWith: string[];
  lookingFor: string[];
  experiences?: IUserExperience[];
  education?: IUserEducation[];
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  verified: boolean;
  status: "active" | "suspended" | "pending";
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    handle: { type: String, unique: true, sparse: true, lowercase: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, default: "" },
    firebaseUid: { type: String, sparse: true, index: true, default: null },
    role: {
      type: String,
      required: true,
      enum: ["student", "alumni", "faculty", "researcher", "admin"],
      default: "student",
      index: true,
    },
    campus: { type: String, required: true, index: true },
    department: { type: String, required: true, index: true },
    graduationYear: { type: Number, default: null },
    headline: { type: String, default: "" },
    bio: { type: String, default: "" },
    company: { type: String, default: null },
    jobRole: { type: String, default: null },
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    helpWith: { type: [String], default: [] },
    lookingFor: { type: [String], default: [] },
    experiences: {
      type: [
        {
          title: { type: String, default: "" },
          company: { type: String, default: "" },
          location: { type: String, default: "" },
          startDate: { type: String, default: "" },
          endDate: { type: String, default: "" },
          current: { type: Boolean, default: false },
          description: { type: String, default: "" },
        },
      ],
      default: [],
    },
    education: {
      type: [
        {
          school: { type: String, default: "" },
          degree: { type: String, default: "" },
          fieldOfStudy: { type: String, default: "" },
          startYear: { type: Number, default: null },
          endYear: { type: Number, default: null },
          grade: { type: String, default: "" },
          activities: { type: String, default: "" },
        },
      ],
      default: [],
    },
    linkedinUrl: { type: String, default: null },
    githubUrl: { type: String, default: null },
    websiteUrl: { type: String, default: null },
    avatarUrl: { type: String, default: null },
    coverUrl: { type: String, default: null },
    verified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "suspended", "pending"],
      default: "active",
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema, "amrita_users");
