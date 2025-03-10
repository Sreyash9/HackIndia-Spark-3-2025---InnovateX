import { users, jobs, proposals, type User, type InsertUser, type Job, type Proposal } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  getFreelancers(): Promise<User[]>;

  // Job methods
  createJob(job: Omit<Job, "id" | "status" | "createdAt">, businessId: number): Promise<Job>;
  getJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;

  // Proposal methods
  createProposal(proposal: Omit<Proposal, "id" | "status">, freelancerId: number): Promise<Proposal>;
  getProposalsByJob(jobId: number): Promise<Proposal[]>;
  getProposalsByFreelancer(freelancerId: number): Promise<Proposal[]>;
  updateProposal(id: number, updates: Partial<Proposal>): Promise<Proposal>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getFreelancers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "freelancer"));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        bio: insertUser.bio ?? null,
        skills: insertUser.skills ?? [],
        hourlyRate: insertUser.hourlyRate ?? null,
        company: insertUser.company ?? null,
        portfolioTitle: insertUser.portfolioTitle ?? null,
        portfolioSummary: insertUser.portfolioSummary ?? null,
        portfolioProjects: insertUser.portfolioProjects ?? null,
        education: insertUser.education ?? null,
        workExperience: insertUser.workExperience ?? null,
        certifications: insertUser.certifications ?? null,
      })
      .returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createJob(job: Omit<Job, "id" | "status" | "createdAt">, businessId: number): Promise<Job> {
    const [newJob] = await db
      .insert(jobs)
      .values({
        ...job,
        businessId,
        status: "open",
        createdAt: new Date(),
      })
      .returning();
    return newJob;
  }

  async getJobs(): Promise<Job[]> {
    return await db.select().from(jobs);
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async createProposal(proposal: Omit<Proposal, "id" | "status">, freelancerId: number): Promise<Proposal> {
    const [newProposal] = await db
      .insert(proposals)
      .values({
        ...proposal,
        freelancerId,
        status: "pending_freelancer",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newProposal;
  }

  async getProposalsByJob(jobId: number): Promise<Proposal[]> {
    return await db.select().from(proposals).where(eq(proposals.jobId, jobId));
  }

  async getProposalsByFreelancer(freelancerId: number): Promise<Proposal[]> {
    return await db.select().from(proposals).where(eq(proposals.freelancerId, freelancerId));
  }

  async updateProposal(id: number, updates: Partial<Proposal>): Promise<Proposal> {
    const [proposal] = await db
      .update(proposals)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, id))
      .returning();
    return proposal;
  }
}

export const storage = new DatabaseStorage();