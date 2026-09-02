import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  passwordHash: string;
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
  avatarUrl?: string | null;
  verified: boolean;
  status: "active" | "suspended" | "pending";
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
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
    avatarUrl: { type: String, default: null },
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
