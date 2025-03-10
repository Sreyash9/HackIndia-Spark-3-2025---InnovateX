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

  // Add new route to get active jobs for a business
  app.get("/api/business/jobs/active", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "business") {
      return res.status(403).json({ message: "Only businesses can view their jobs" });
    }

    try {
      const jobs = await storage.getJobs();
      // Filter jobs that belong to the business and are in an active state
      const activeJobs = jobs.filter(job =>
        job.businessId === req.user.id &&
        job.status === "open"
      );
      res.json(activeJobs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching active jobs" });
    }
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

  // Add route to get freelancer's job requests
  app.get("/api/freelancer/job-requests", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "freelancer") {
      return res.status(403).json({ message: "Only freelancers can view their job requests" });
    }

    try {
      const proposals = await storage.getProposalsByFreelancer(req.user.id);

      // Enrich the proposals with job and business details
      const enrichedProposals = await Promise.all(
        proposals.map(async (proposal) => {
          const job = await storage.getJob(proposal.jobId);
          const business = job ? await storage.getUser(job.businessId) : null;

          return {
            ...proposal,
            job: {
              title: job?.title,
              description: job?.description,
              budget: job?.budget,
            },
            business: business ? {
              displayName: business.displayName,
              username: business.username,
            } : null,
          };
        })
      );

      res.json(enrichedProposals);
    } catch (error) {
      res.status(500).json({ message: "Error fetching job requests" });
    }
  });

  // Add route to create job request
  app.post("/api/job-requests", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "business") {
      return res.status(403).json({ message: "Only businesses can send job requests" });
    }

    try {
      const { jobId, freelancerId } = req.body;

      // Verify the job belongs to the business
      const job = await storage.getJob(jobId);
      if (!job || job.businessId !== req.user.id) {
        return res.status(403).json({ message: "Invalid job" });
      }

      // Create a proposal
      const proposal = await storage.createProposal({
        jobId,
        freelancerId,
        coverLetter: "Job offer from business",
        proposedRate: job.budget,
        status: "pending_freelancer",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, freelancerId);

      res.status(201).json(proposal);
    } catch (error) {
      console.error("Error creating job request:", error);
      res.status(500).json({ message: "Error creating job request" });
    }
  });

  // Update proposal status (for both freelancer and business)
  app.patch("/api/proposals/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const proposalId = parseInt(req.params.id);
    const { status } = req.body;

    try {
      // Get the proposal first to check permissions
      const proposal = await storage.getProposalsByFreelancer(req.user.id);
      const userProposal = proposal.find(p => p.id === proposalId);

      if (!userProposal) {
        return res.status(403).json({ message: "Proposal not found or access denied" });
      }

      // Validate status based on user role
      if (req.user.role === "freelancer") {
        if (!["approved", "rejected"].includes(status)) {
          return res.status(400).json({ message: "Invalid status for freelancer" });
        }
      } else if (req.user.role === "business") {
        if (!["applied", "under_review", "approved", "rejected", "waitlist"].includes(status)) {
          return res.status(400).json({ message: "Invalid status for business" });
        }
      }

      const updatedProposal = await storage.updateProposal(proposalId, { 
        status,
        updatedAt: new Date()
      });

      res.json(updatedProposal);
    } catch (error) {
      console.error("Error updating proposal:", error);
      res.status(500).json({ message: "Error updating proposal" });
    }
  });

  // Add this route along with other proposal routes
  app.delete("/api/proposals/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const proposalId = parseInt(req.params.id);

    try {
      // Get the proposal first to check permissions
      const proposals = await storage.getProposalsByFreelancer(req.user.id);
      const userProposal = proposals.find(p => p.id === proposalId);

      if (!userProposal) {
        return res.status(403).json({ message: "Proposal not found or access denied" });
      }

      await storage.deleteProposal(proposalId);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error deleting proposal:", error);
      res.status(500).json({ message: "Error deleting proposal" });
    }
  });

  // Add this route before the Razorpay payment routes
  app.get("/api/freelancers/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "business") {
      return res.status(403).json({ message: "Only businesses can view freelancer profiles" });
    }

    try {
      const freelancer = await storage.getUser(parseInt(req.params.id));
      if (!freelancer || freelancer.role !== "freelancer") {
        return res.status(404).json({ message: "Freelancer not found" });
      }
      res.json(freelancer);
    } catch (error) {
      res.status(500).json({ message: "Error fetching freelancer profile" });
    }
  });

  app.get("/api/freelancers", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "business") {
      return res.status(403).json({ message: "Only businesses can view freelancers" });
    }

    try {
      const freelancers = await storage.getFreelancers();
      res.json(freelancers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching freelancers" });
    }
  });

  // Razorpay payment routes
  app.post("/api/create-order", async (req, res) => {
    try {
      const { amount } = req.body;
      const options = {
        amount: Math.round(amount * 100),
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