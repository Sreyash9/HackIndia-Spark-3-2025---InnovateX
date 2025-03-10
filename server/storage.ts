import { InsertUser, User, Job, Proposal, insertJobSchema, insertProposalSchema } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  sessionStore: session.Store;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Job methods
  createJob(job: Omit<Job, "id" | "status" | "createdAt">, businessId: number): Promise<Job>;
  getJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;

  // Proposal methods
  createProposal(proposal: Omit<Proposal, "id" | "status">, freelancerId: number): Promise<Proposal>;
  getProposalsByJob(jobId: number): Promise<Proposal[]>;
  getProposalsByFreelancer(freelancerId: number): Promise<Proposal[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private jobs: Map<number, Job>;
  private proposals: Map<number, Proposal>;
  sessionStore: session.Store;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.jobs = new Map();
    this.proposals = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = {
      ...insertUser,
      id,
      bio: insertUser.bio ?? null,
      skills: insertUser.skills ?? null,
      hourlyRate: insertUser.hourlyRate ?? null,
      company: insertUser.company ?? null,
    };
    this.users.set(id, user);
    return user;
  }

  async createJob(job: Omit<Job, "id" | "status" | "createdAt">, businessId: number): Promise<Job> {
    const id = this.currentId++;
    const newJob: Job = {
      ...job,
      id,
      businessId,
      status: "open",
      createdAt: new Date(),
    };
    this.jobs.set(id, newJob);
    return newJob;
  }

  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async createProposal(proposal: Omit<Proposal, "id" | "status">, freelancerId: number): Promise<Proposal> {
    const id = this.currentId++;
    const newProposal: Proposal = {
      ...proposal,
      id,
      freelancerId,
      status: "pending",
    };
    this.proposals.set(id, newProposal);
    return newProposal;
  }

  async getProposalsByJob(jobId: number): Promise<Proposal[]> {
    return Array.from(this.proposals.values()).filter(p => p.jobId === jobId);
  }

  async getProposalsByFreelancer(freelancerId: number): Promise<Proposal[]> {
    return Array.from(this.proposals.values()).filter(p => p.freelancerId === freelancerId);
  }
}

export const storage = new MemStorage();