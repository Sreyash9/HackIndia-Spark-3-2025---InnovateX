import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["freelancer", "business"] }).notNull(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  skills: text("skills").array(),
  hourlyRate: integer("hourly_rate"),
  company: text("company"),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  budget: integer("budget").notNull(),
  skills: text("skills").array().notNull(),
  businessId: integer("business_id").notNull(),
  status: text("status", { enum: ["open", "in_progress", "completed"] }).notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  freelancerId: integer("freelancer_id").notNull(),
  coverLetter: text("cover_letter").notNull(),
  proposedRate: integer("proposed_rate").notNull(),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).notNull().default("pending"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  displayName: true,
  bio: true,
  skills: true,
  hourlyRate: true,
  company: true,
});

export const insertJobSchema = createInsertSchema(jobs).pick({
  title: true,
  description: true,
  budget: true,
  skills: true,
});

export const insertProposalSchema = createInsertSchema(proposals).pick({
  jobId: true,
  coverLetter: true,
  proposedRate: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Proposal = typeof proposals.$inferSelect;
