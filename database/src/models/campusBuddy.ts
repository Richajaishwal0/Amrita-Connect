import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IBuddyReview {
  authorId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface ICampusBuddyHost extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  campus: string;
  department: string;
  servicesOffered: string[];
  bio: string;
  languages: string[];
  availability: "Available" | "Busy" | "Away";
  reviews: IBuddyReview[];
  createdAt: Date;
}

export interface ICampusBuddyRequest extends Document {
  _id: mongoose.Types.ObjectId;
  requesterId: mongoose.Types.ObjectId;
  hostId: mongoose.Types.ObjectId;
  targetCampus: string;
  visitReason: "Hackathon / Competition" | "Campus Tour" | "Research & Lab Visit" | "Inter-Campus Transfer" | "General Visit";
  visitDates: string;
  notes: string;
  status: "pending" | "accepted" | "declined";
  createdAt: Date;
}

const BuddyReviewSchema = new Schema<IBuddyReview>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CampusBuddyHostSchema = new Schema<ICampusBuddyHost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    campus: { type: String, required: true, index: true },
    department: { type: String, required: true },
    servicesOffered: { type: [String], default: [] },
    bio: { type: String, required: true },
    languages: { type: [String], default: ["English"] },
    availability: {
      type: String,
      enum: ["Available", "Busy", "Away"],
      default: "Available",
      index: true,
    },
    reviews: { type: [BuddyReviewSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

const CampusBuddyRequestSchema = new Schema<ICampusBuddyRequest>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    hostId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetCampus: { type: String, required: true, index: true },
    visitReason: {
      type: String,
      enum: ["Hackathon / Competition", "Campus Tour", "Research & Lab Visit", "Inter-Campus Transfer", "General Visit"],
      default: "General Visit",
    },
    visitDates: { type: String, required: true },
    notes: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

export const CampusBuddyHostModel: Model<ICampusBuddyHost> =
  mongoose.models.CampusBuddyHost ||
  mongoose.model<ICampusBuddyHost>("CampusBuddyHost", CampusBuddyHostSchema, "amrita_campus_buddy_hosts");

export const CampusBuddyRequestModel: Model<ICampusBuddyRequest> =
  mongoose.models.CampusBuddyRequest ||
  mongoose.model<ICampusBuddyRequest>("CampusBuddyRequest", CampusBuddyRequestSchema, "amrita_campus_buddy_requests");
