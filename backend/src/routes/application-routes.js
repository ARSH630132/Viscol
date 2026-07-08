import { Router } from "express";

import { prisma } from "../db.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth-middleware.js";
import { applicationSchema } from "../validators.js";

export const applicationRouter = Router();

applicationRouter.post(
  "/applications",
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = applicationSchema.parse(req.body);
    const application = await prisma.application.create({
      data: {
        studentName: input.student_name,
        phone: input.phone,
        email: input.email,
        course: input.course,
        city: input.city,
        budget: input.budget,
        preferredCollegeId: input.preferred_college_id || null,
        message: input.message || null,
      },
    });

    res.status(201).json({
      data: {
        id: application.id,
        student_name: application.studentName,
        phone: application.phone,
        email: application.email,
        course: application.course,
        city: application.city,
        budget: application.budget,
        preferred_college_id: application.preferredCollegeId,
        message: application.message,
        created_at: application.createdAt,
      },
    });
  }),
);
