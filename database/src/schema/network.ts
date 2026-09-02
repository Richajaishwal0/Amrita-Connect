import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, text, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const collaborationsTable = pgTable("amrita_collaborations", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requiredSkills: text("required_skills").array().notNull(),
  teamSize: integer("team_size").notNull(),
  deadline: text("deadline").notNull(),
  category: text("category").notNull(),
  memberCount: integer("member_count").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCollaborationSchema = createInsertSchema(collaborationsTable).omit({ id: true, createdAt: true });
export type InsertCollaboration = z.infer<typeof insertCollaborationSchema>;
export type Collaboration = typeof collaborationsTable.$inferSelect;

export const mentorshipRequestsTable = pgTable("amrita_mentorship_requests", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull(),
  mentorId: integer("mentor_id").notNull(),
  message: text("message").notNull(),
  reason: text("reason").notNull(),
  topic: text("topic").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMentorshipRequestSchema = createInsertSchema(mentorshipRequestsTable).omit({ id: true, createdAt: true });
export type InsertMentorshipRequest = z.infer<typeof insertMentorshipRequestSchema>;
export type MentorshipRequest = typeof mentorshipRequestsTable.$inferSelect;

export const notificationsTable = pgTable("amrita_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;

export const savedOpportunitiesTable = pgTable("amrita_saved_opportunities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  opportunityId: integer("opportunity_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  savedOpportunityUnique: uniqueIndex("amrita_saved_opportunities_user_opportunity_idx").on(table.userId, table.opportunityId),
}));

export const insertSavedOpportunitySchema = createInsertSchema(savedOpportunitiesTable).omit({ id: true, createdAt: true });
export type InsertSavedOpportunity = z.infer<typeof insertSavedOpportunitySchema>;
export type SavedOpportunity = typeof savedOpportunitiesTable.$inferSelect;

export const eventRegistrationsTable = pgTable("amrita_event_registrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  eventId: integer("event_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  eventRegistrationUnique: uniqueIndex("amrita_event_registrations_user_event_idx").on(table.userId, table.eventId),
}));

export const insertEventRegistrationSchema = createInsertSchema(eventRegistrationsTable).omit({ id: true, createdAt: true });
export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;
export type EventRegistration = typeof eventRegistrationsTable.$inferSelect;
