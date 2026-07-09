import { Router } from "express";
import nodemailer from "nodemailer";

import { prisma } from "../db.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth-middleware.js";
import { applicationSchema } from "../validators.js";

export const applicationRouter = Router();

const mailTransport = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },

    // Timeouts
    family: 4,
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });

const formatApplicationPayload = (input, createdAt) => ({
  submitted_at: createdAt.toISOString(),
  name: input.student_name,
  phone: input.phone,
  email: input.email,
  course: input.course,
  budget: input.budget,
  city: input.city,
  preferred_college: input.preferred_college_name || "",
  message: input.message || "",
});

const sendApplicationEmail = async (payload) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.ADMIN_EMAIL) {
    const error = new Error("Email notification is not configured");
    error.status = 500;
    throw error;
  }

  await mailTransport().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.ADMIN_EMAIL,
    subject: "New Apply Through College Visitor submission",
    text: [
      `Name: ${payload.name}`,
      `Phone: ${payload.phone}`,
      `Email: ${payload.email}`,
      `Course: ${payload.course}`,
      `Budget: ${payload.budget}`,
      `City: ${payload.city}`,
      `Preferred College: ${payload.preferred_college || "Not provided"}`,
      `Submitted At: ${payload.submitted_at}`,
    ].join("\n"),
    html: [
      `<p>Name: ${payload.name}</p>`,
      `<p>Phone: ${payload.phone}</p>`,
      `<p>Email: <a href="mailto:${payload.email}">${payload.email}</a></p>`,
      `<p>Course: ${payload.course}</p>`,
      `<p>Budget: ${payload.budget}</p>`,
      `<p>City: ${payload.city}</p>`,
      `<p>Preferred College: ${payload.preferred_college || "Not provided"}</p>`,
      `<p>Submitted At: ${payload.submitted_at}</p>`,
    ].join(""),
  });
};

const sendApplicationToSheet = async (payload) => {
  if (!process.env.GOOGLE_APPS_SCRIPT_URL) {
    const error = new Error("Google Sheets integration is not configured");
    error.status = 500;
    throw error;
  }

  const response = await fetch(process.env.GOOGLE_APPS_SCRIPT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timestamp: payload.submitted_at,
      date_time: payload.submitted_at,
      name: payload.name,
      contact_no: payload.phone,
      phone: payload.phone,
      gmail: payload.email,
      email: payload.email,
      course: payload.course,
      budget: payload.budget,
      location: payload.city,
      city: payload.city,
      collegeName: payload.preferred_college,
      college: payload.preferred_college,
      college_name: payload.preferred_college,
      preferredCollege: payload.preferred_college,
      preferred_college: payload.preferred_college,
      preferred_college_name: payload.preferred_college,
    }),
  });

  if (!response.ok) {
    const error = new Error("Unable to store application in Google Sheets");
    error.status = 502;
    throw error;
  }
};

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
        message: input.message || input.preferred_college_name || null,
      },
    });
    const payload = formatApplicationPayload(input, application.createdAt);

    await Promise.all([sendApplicationToSheet(payload), sendApplicationEmail(payload)]);

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
        preferred_college_name: input.preferred_college_name || null,
        message: application.message,
        created_at: application.createdAt,
      },
    });
  }),
);
