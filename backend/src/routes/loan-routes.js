import { Router } from "express";
import { z } from "zod";

import { prisma } from "../db.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireRole } from "../middleware/auth-middleware.js";
import { syncLoanApplicationToSheet } from "../services/loan-sheet-sync.js";

export const loanRouter = Router();

const providerSchema = z.object({
  name: z.string().trim().min(2).max(160),
  providerType: z.string().trim().min(2).max(120),
  loanType: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(3000),
  eligibility: z.string().trim().min(2).max(3000),
  interestRate: z.string().trim().min(1).max(120),
  maximumAmount: z.string().trim().min(1).max(120),
  requiredDocuments: z.array(z.string().trim().min(1).max(240)).max(30),
  processDetails: z.string().trim().min(2).max(3000),
  contactInformation: z.string().trim().min(2).max(1000),
  isVisible: z.boolean(),
  isActive: z.boolean(),
});

const loanApplicationSchema = z.object({
  providerId: z.number().int().positive(),
  course: z.string().trim().min(1).max(160),
  collegeName: z.string().trim().min(2).max(200),
  requestedAmount: z.number().int().positive().max(1000000000),
  coBorrowerName: z.string().trim().min(2).max(160),
  coBorrowerRelationship: z.string().trim().min(2).max(80),
  message: z.string().trim().max(3000).optional().default(""),
});

const loanStatusSchema = z.object({
  status: z.enum(["Submitted", "UnderReview", "Approved", "Rejected"]),
  adminRemark: z.string().trim().max(3000).optional().nullable(),
});

loanRouter.get(
  "/loans/providers",
  requireRole("Student", "Admin"),
  asyncHandler(async (_req, res) => {
    const providers = await prisma.loanProvider.findMany({
      where: { isVisible: true, isActive: true },
      orderBy: { name: "asc" },
    });
    res.json({ data: providers });
  }),
);

loanRouter.get(
  "/loans/applications",
  requireRole("Student", "Admin"),
  asyncHandler(async (req, res) => {
    const applications = await prisma.loanApplication.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: applications });
  }),
);

loanRouter.post(
  "/loans/applications",
  requireRole("Student", "Admin"),
  asyncHandler(async (req, res) => {
    const input = loanApplicationSchema.parse(req.body);
    const provider = await prisma.loanProvider.findFirst({
      where: { id: input.providerId, isVisible: true, isActive: true },
      select: { id: true, name: true, loanType: true },
    });
    if (!provider) return res.status(404).json({ error: { message: "This loan provider is no longer available" } });

    const application = await prisma.loanApplication.create({
      data: {
        userId: req.user.id,
        providerId: provider.id,
        providerName: provider.name,
        loanType: provider.loanType,
        studentName: req.user.name,
        studentMobile: req.user.mobile,
        studentEmail: req.user.email,
        course: input.course,
        collegeName: input.collegeName,
        requestedAmount: input.requestedAmount,
        coBorrowerName: input.coBorrowerName,
        coBorrowerRelationship: input.coBorrowerRelationship,
        message: input.message || null,
      },
    });
    const sheetSync = await syncLoanApplicationToSheet({
      application,
      eventType: "SUBMITTED",
      eventAt: application.createdAt,
    });
    res.status(201).json({ data: application, sheetSync });
  }),
);

loanRouter.get(
  "/admin/loan-providers",
  requireRole("Admin"),
  asyncHandler(async (_req, res) => {
    const providers = await prisma.loanProvider.findMany({ orderBy: { name: "asc" } });
    res.json({ data: providers });
  }),
);

loanRouter.post(
  "/admin/loan-providers",
  requireRole("Admin"),
  asyncHandler(async (req, res) => {
    const input = providerSchema.parse(req.body);
    const provider = await prisma.loanProvider.create({ data: input });
    res.status(201).json({ data: provider });
  }),
);

loanRouter.patch(
  "/admin/loan-providers/:id",
  requireRole("Admin"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: { message: "A valid provider ID is required" } });
    const input = providerSchema.partial().parse(req.body);
    const provider = await prisma.loanProvider.update({ where: { id }, data: input });
    res.json({ data: provider });
  }),
);

loanRouter.delete(
  "/admin/loan-providers/:id",
  requireRole("Admin"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: { message: "A valid provider ID is required" } });
    const provider = await prisma.loanProvider.update({
      where: { id },
      data: { isActive: false, isVisible: false },
    });
    res.json({ data: provider });
  }),
);

loanRouter.get(
  "/admin/loan-applications",
  requireRole("Admin"),
  asyncHandler(async (_req, res) => {
    const applications = await prisma.loanApplication.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: applications });
  }),
);

loanRouter.patch(
  "/admin/loan-applications/:id",
  requireRole("Admin"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: { message: "A valid application ID is required" } });
    const input = loanStatusSchema.parse(req.body);
    const previousApplication = await prisma.loanApplication.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!previousApplication) return res.status(404).json({ error: { message: "Loan application not found" } });
    const application = await prisma.loanApplication.update({
      where: { id },
      data: { status: input.status, adminRemark: input.adminRemark || null },
    });
    const sheetSync = await syncLoanApplicationToSheet({
      application,
      eventType: "STATUS_UPDATED",
      previousStatus: previousApplication.status,
      eventAt: application.updatedAt,
    });
    res.json({ data: application, sheetSync });
  }),
);
