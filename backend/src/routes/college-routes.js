import { Router } from "express";

import { asyncHandler } from "../middleware/async-handler.js";
import { compareColleges, getCollegeBySlug, listColleges } from "../services/college-service.js";
import { collegeListQuerySchema, compareQuerySchema } from "../validators.js";

export const collegeRouter = Router();

collegeRouter.get(
  "/colleges",
  asyncHandler(async (req, res) => {
    const query = collegeListQuerySchema.parse(req.query);
    const result = await listColleges(query);
    res.json(result);
  }),
);

collegeRouter.get(
  "/colleges/:slug",
  asyncHandler(async (req, res) => {
    const college = await getCollegeBySlug(req.params.slug);
    if (!college) {
      return res.status(404).json({ error: { message: "College not found" } });
    }
    res.json({ data: college });
  }),
);

collegeRouter.get(
  "/compare",
  asyncHandler(async (req, res) => {
    const { ids } = compareQuerySchema.parse(req.query);
    const data = await compareColleges(ids);
    res.json({ data });
  }),
);
