import { Router } from "express";

import { prisma } from "../db.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { ADMIN_MOBILES, requireCollegeAccess, requireRole } from "../middleware/auth-middleware.js";
import { toApiCollege } from "../services/college-service.js";

export const managementRouter = Router();

const collegeFields = [
  "name", "slug", "description", "collegeType", "state", "city", "address", "pincode", "website", "email", "phone",
  "establishedYear", "affiliation", "approvals", "accreditations", "rating", "logoUrl", "coverImageUrl", "galleryImages", "videoUrl",
];

const pickCollegeFields = (body) => Object.fromEntries(collegeFields.filter((key) => key in body).map((key) => [key, body[key]]));

const updateCollege = async (id, body) => {
  const data = pickCollegeFields(body);
  const college = await prisma.$transaction(async (tx) => {
    await tx.college.update({ where: { id }, data });
    if (Array.isArray(body.courses)) {
      await tx.course.deleteMany({ where: { collegeId: id } });
      for (const item of body.courses) {
        const course = await tx.course.create({ data: { collegeId: id, courseName: item.courseName, branchName: item.branchName, durationYears: Number(item.durationYears), eligibility: item.eligibility, entranceExam: item.entranceExam || null, seats: Number(item.seats) } });
        if (item.fees) await tx.fee.create({ data: { ...item.fees, collegeId: id, courseId: course.id } });
        if (item.placements) await tx.placement.create({ data: { ...item.placements, collegeId: id, courseId: course.id } });
      }
    }
    if (Array.isArray(body.scholarships)) {
      await tx.scholarship.deleteMany({ where: { collegeId: id } });
      if (body.scholarships.length) await tx.scholarship.createMany({ data: body.scholarships.map((item) => ({ ...item, collegeId: id })) });
    }
    if (body.hostel) {
      await tx.hostel.upsert({ where: { collegeId: id }, create: { ...body.hostel, collegeId: id }, update: body.hostel });
    }
    return tx.college.findUniqueOrThrow({ where: { id }, include: { courses: { include: { fees: true, placements: true } }, fees: true, placements: true, scholarships: true, hostel: true, reviews: true } });
  });
  return toApiCollege(college);
};

managementRouter.get("/admin/users", requireRole("Admin"), asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({
    include: { collegeAccesses: { include: { college: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ data: users.map((user) => ({
    id: user.id, name: user.name, email: user.email, mobile: user.mobile,
    role: ADMIN_MOBILES.has(user.mobile) ? "Admin" : user.role,
    assigned_colleges: user.collegeAccesses.map((access) => access.college),
  })) });
}));

managementRouter.patch("/admin/users/:id", requireRole("Admin"), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const role = req.body.role;
  if (!Number.isInteger(id) || !["Student", "College", "Admin"].includes(role)) return res.status(400).json({ error: "A valid role is required" });
  const current = await prisma.user.findUniqueOrThrow({ where: { id } });
  const collegeIds = Array.isArray(req.body.collegeIds) ? [...new Set(req.body.collegeIds.map(Number).filter(Number.isInteger))] : [];
  const user = await prisma.$transaction(async (tx) => {
    await tx.collegeAccess.deleteMany({ where: { userId: id } });
    if (role === "College" && collegeIds.length) await tx.collegeAccess.createMany({ data: collegeIds.map((collegeId) => ({ userId: id, collegeId })) });
    return tx.user.update({ where: { id }, data: { role: ADMIN_MOBILES.has(current.mobile) ? "Admin" : role } });
  });
  res.json({ data: { id: user.id, role: ADMIN_MOBILES.has(user.mobile) ? "Admin" : user.role } });
}));

managementRouter.get("/admin/colleges", requireRole("Admin"), asyncHandler(async (_req, res) => {
  const colleges = await prisma.college.findMany({ orderBy: { name: "asc" }, include: { courses: { include: { fees: true, placements: true } }, fees: true, placements: true, scholarships: true, hostel: true, reviews: true } });
  const visibility = await prisma.$queryRaw`SELECT id, is_visible FROM colleges`;
  const visibilityById = new Map(visibility.map((item) => [item.id, item.is_visible]));
  res.json({ data: colleges.map((college) => ({ ...toApiCollege(college), isVisible: Boolean(visibilityById.get(college.id)) })) });
}));

managementRouter.post("/admin/colleges", requireRole("Admin"), asyncHandler(async (req, res) => {
  const college = await prisma.college.create({ data: { ...pickCollegeFields(req.body), isVisible: req.body.isVisible ?? true }, include: { courses: true, fees: true, placements: true, scholarships: true, hostel: true, reviews: true } });
  res.status(201).json({ data: toApiCollege(college) });
}));

managementRouter.patch("/admin/colleges/:id", requireRole("Admin"), asyncHandler(async (req, res) => {
  res.json({ data: await updateCollege(Number(req.params.id), req.body) });
}));

managementRouter.patch("/admin/colleges/:id/visibility", requireRole("Admin"), asyncHandler(async (req, res) => {
  if (typeof req.body.isVisible !== "boolean") return res.status(400).json({ error: "isVisible must be a boolean" });
  const colleges = await prisma.$queryRaw`
    UPDATE colleges
    SET is_visible = ${req.body.isVisible}
    WHERE id = ${Number(req.params.id)}
    RETURNING id, is_visible
  `;
  const college = colleges[0];
  if (!college) return res.status(404).json({ error: "College not found" });
  res.json({ data: { id: college.id, isVisible: Boolean(college.is_visible) } });
}));

managementRouter.get("/college-dashboard/colleges", requireRole("College", "Admin"), asyncHandler(async (req, res) => {
  const where = req.user.role === "Admin" ? {} : { collegeAccesses: { some: { userId: req.user.id } } };
  const colleges = await prisma.college.findMany({ where, orderBy: { name: "asc" } });
  res.json({ data: colleges });
}));

managementRouter.patch("/college-dashboard/colleges/:id", requireCollegeAccess, asyncHandler(async (req, res) => {
  res.json({ data: await updateCollege(Number(req.params.id), req.body) });
}));
