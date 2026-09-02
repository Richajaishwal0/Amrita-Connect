import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IOpportunity extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  organization: string;
  requiredSkills: string[];
  eligibility: string;
  deadline: string;
  applicationUrl: string;
  createdAt: Date;
}

const OpportunitySchema = new Schema<IOpportunity>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    organization: { type: String, required: true, index: true },
    requiredSkills: { type: [String], default: [] },
    eligibility: { type: String, required: true },
    deadline: { type: String, required: true },
    applicationUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

export const OpportunityModel: Model<IOpportunity> =
  mongoose.models.Opportunity || mongoose.model<IOpportunity>("Opportunity", OpportunitySchema, "amrita_opportunities");

export interface ISavedOpportunity extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  opportunityId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const SavedOpportunitySchema = new Schema<ISavedOpportunity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    opportunityId: { type: Schema.Types.ObjectId, ref: "Opportunity", required: true, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

SavedOpportunitySchema.index({ userId: 1, opportunityId: 1 }, { unique: true });

export const SavedOpportunityModel: Model<ISavedOpportunity> =
  mongoose.models.SavedOpportunity || mongoose.model<ISavedOpportunity>("SavedOpportunity", SavedOpportunitySchema, "amrita_saved_opportunities");
