import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  date: Date;
  campus: string;
  venue: string;
  organizer: string;
  registrationUrl?: string | null;
  capacity?: number | null;
  createdAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    date: { type: Date, required: true, index: true },
    campus: { type: String, required: true, index: true },
    venue: { type: String, required: true },
    organizer: { type: String, required: true },
    registrationUrl: { type: String, default: null },
    capacity: { type: Number, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

export const EventModel: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema, "amrita_events");

export interface IEventRegistration extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const EventRegistrationSchema = new Schema<IEventRegistration>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

EventRegistrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export const EventRegistrationModel: Model<IEventRegistration> =
  mongoose.models.EventRegistration || mongoose.model<IEventRegistration>("EventRegistration", EventRegistrationSchema, "amrita_event_registrations");
