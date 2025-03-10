import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertJobSchema, insertProposalSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import Razorpay from "razorpay";
import { hashPassword } from "./utils"; // Assuming hashPassword function exists in ./utils

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('Missing required Razorpay credentials: RAZORPAY_KEY_ID and/or RAZORPAY_KEY_SECRET');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Add the admin account creation route
  app.post("/api/admin/setup", async (req, res) => {
    try {
      // Check if admin already exists
      const existingAdmin = await storage.getUserByUsername("sreyashsunilnaik@gmail.com");
      if (existingAdmin) {
        return res.status(400).json({ message: "Admin account already exists" });
      }

      // Create admin user
      const user = await storage.createUser({
        username: "sreyashsunilnaik@gmail.com",
        password: await hashPassword("sre123"),
        role: "admin",
        displayName: "Sreyash Admin",
        bio: null,
        skills: [],
        hourlyRate: null,
        company: null,
        portfolioTitle: null,
        portfolioSummary: null,
        portfolioProjects: null,
        education: null,
        workExperience: null,
        certifications: null,
      });

      res.status(201).json({ message: "Admin account created successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.get("/api/admin/jobs", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const jobs = await storage.getAllJobs();
    res.json(jobs);
  });

  // User routes
  app.patch("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.id !== parseInt(req.params.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const updateData = insertUserSchema.partial().parse(req.body);
      const updatedUser = await storage.updateUser(parseInt(req.params.id), updateData);
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // Jobs
  app.post("/api/jobs", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "business") {
      return res.status(403).json({ message: "Only businesses can post jobs" });
    }

    const validatedJob = insertJobSchema.parse(req.body);
    const job = await storage.createJob(validatedJob, req.user.id);
    res.status(201).json(job);
  });

  app.get("/api/jobs", async (_req, res) => {
    const jobs = await storage.getJobs();
    res.json(jobs);
  });

  app.get("/api/jobs/:id", async (req, res) => {
    const job = await storage.getJob(parseInt(req.params.id));
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  });

  // Proposals
  app.post("/api/proposals", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "freelancer") {
      return res.status(403).json({ message: "Only freelancers can submit proposals" });
    }

    const validatedProposal = insertProposalSchema.parse(req.body);
    const proposal = await storage.createProposal(validatedProposal, req.user.id);
    res.status(201).json(proposal);
  });

  app.get("/api/jobs/:jobId/proposals", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    const proposals = await storage.getProposalsByJob(parseInt(req.params.jobId));
    res.json(proposals);
  });

  // Razorpay payment routes
  app.post("/api/create-order", async (req, res) => {
    try {
      const { amount } = req.body;
      const options = {
        amount: Math.round(amount * 100), // amount in smallest currency unit (paise for INR)
        currency: "INR",
        receipt: "order_" + Date.now(),
      };

      const order = await razorpay.orders.create(options);
      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating order: " + error.message });
    }
  });

  // Verify Razorpay payment
  app.post("/api/verify-payment", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      const hmac = require('crypto').createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!);
      const generated_signature = hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');

      if (generated_signature === razorpay_signature) {
        res.json({ verified: true });
      } else {
        res.status(400).json({ verified: false, message: "Invalid signature" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Error verifying payment: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}