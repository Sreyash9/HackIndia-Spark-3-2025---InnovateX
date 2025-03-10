import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertJobSchema, insertProposalSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import Razorpay from "razorpay";

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('Missing required Razorpay credentials: RAZORPAY_KEY_ID and/or RAZORPAY_KEY_SECRET');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // User routes
  app.patch("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const updateData = insertUserSchema.partial().parse(req.body);
      const updatedUser = await storage.updateUser(req.user.id, updateData);
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

  app.get("/api/business/:businessId/proposals", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "business") {
      return res.status(403).json({ message: "Only businesses can view their proposals" });
    }

    try {
      const jobIds = (await storage.getJobs()).filter(job => job.businessId === req.user.id).map(job => job.id);
      const proposals = [];

      for (const jobId of jobIds) {
        const jobProposals = await storage.getProposalsByJob(jobId);
        const job = await storage.getJob(jobId);
        // Get freelancer details for each proposal
        const proposalsWithFreelancers = await Promise.all(
          jobProposals.map(async (proposal) => {
            const freelancer = await storage.getUser(proposal.freelancerId);
            return {
              ...proposal,
              job: {
                title: job?.title,
                description: job?.description,
              },
              freelancer: {
                displayName: freelancer?.displayName,
                username: freelancer?.username,
              }
            };
          })
        );
        proposals.push(...proposalsWithFreelancers);
      }

      res.json(proposals);
    } catch (error) {
      res.status(500).json({ message: "Error fetching proposals" });
    }
  });

  app.patch("/api/proposals/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "business") {
      return res.status(403).json({ message: "Only businesses can update proposals" });
    }

    const proposalId = parseInt(req.params.id);
    const { status } = req.body;

    if (!["applied", "under_review", "approved", "rejected", "waitlist"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    try {
      const proposal = await storage.updateProposal(proposalId, { status });
      res.json(proposal);
    } catch (error) {
      res.status(500).json({ message: "Error updating proposal" });
    }
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