import { createInsertSchema } from "drizzle-zod";
import { boolean, date, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";

const emptyTextArray = sql`ARRAY[]::text[]`;

export const usersTable = pgTable("amrita_users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(),
  campus: text("campus").notNull(),
  department: text("department").notNull(),
  graduationYear: integer("graduation_year"),
  headline: text("headline").notNull().default(""),
  bio: text("bio").notNull().default(""),
  company: text("company"),
  jobRole: text("job_role"),
  skills: text("skills").array().notNull().default(emptyTextArray),
  interests: text("interests").array().notNull().default(emptyTextArray),
  helpWith: text("help_with").array().notNull().default(emptyTextArray),
  lookingFor: text("looking_for").array().notNull().default(emptyTextArray),
  avatarUrl: text("avatar_url"),
  verified: boolean("verified").notNull().default(false),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const opportunitiesTable = pgTable("amrita_opportunities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  organization: text("organization").notNull(),
  requiredSkills: text("required_skills").array().notNull().default(emptyTextArray),
  eligibility: text("eligibility").notNull(),
  deadline: date("deadline", { mode: "string" }).notNull(),
  applicationUrl: text("application_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOpportunitySchema = createInsertSchema(opportunitiesTable).omit({ id: true, createdAt: true });
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type Opportunity = typeof opportunitiesTable.$inferSelect;

export const eventsTable = pgTable("amrita_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  campus: text("campus").notNull(),
  venue: text("venue").notNull(),
  organizer: text("organizer").notNull(),
  registrationUrl: text("registration_url"),
  capacity: integer("capacity"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true, createdAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;