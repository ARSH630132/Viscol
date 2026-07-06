import { Router } from "express";
import multer from "multer";

import { asyncHandler } from "../middleware/async-handler.js";
import { importCollegeRows, parseCsv, parseExcel } from "../services/import-service.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export const importRouter = Router();

importRouter.post(
  "/import/csv",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: { message: "CSV file is required in form-data field 'file'" } });
    }

    const rows = parseCsv(req.file.buffer);
    const imported = await importCollegeRows(rows);
    res.status(201).json({ imported_count: imported.length, data: imported });
  }),
);

importRouter.post(
  "/import/excel",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: { message: "Excel file is required in form-data field 'file'" } });
    }

    const rows = parseExcel(req.file.buffer);
    const imported = await importCollegeRows(rows);
    res.status(201).json({ imported_count: imported.length, data: imported });
  }),
);
