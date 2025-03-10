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
  portfolioTitle: text("portfolio_title"),
  portfolioSummary: text("portfolio_summary"),
  portfolioProjects: json("portfolio_projects").array(),
  education: json("education").array(),
  workExperience: json("work_experience").array(),
  certifications: json("certifications").array(),
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
  portfolioTitle: true,
  portfolioSummary: true,
  portfolioProjects: true,
  education: true,
  workExperience: true,
  certifications: true,
}).extend({
  username: z.string().min(3, "Username must be at least 3 characters").email("Must be a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["freelancer", "business"]),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  bio: z.string().nullable().optional(),
  skills: z.array(z.string()).optional().default([]),
  hourlyRate: z.number().nullable().optional(),
  company: z.string().nullable().optional(),
  portfolioTitle: z.string().nullable().optional(),
  portfolioSummary: z.string().nullable().optional(),
  portfolioProjects: z.array(z.object({
    title: z.string(),
    description: z.string(),
    link: z.string().optional(),
    technologies: z.array(z.string()),
  })).nullable().optional(),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    fieldOfStudy: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
  })).nullable().optional(),
  workExperience: z.array(z.object({
    company: z.string(),
    position: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    description: z.string(),
  })).nullable().optional(),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    date: z.string(),
    link: z.string().optional(),
  })).nullable().optional(),
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