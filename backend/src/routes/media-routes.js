import { randomUUID } from "node:crypto";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Router } from "express";
import multer from "multer";

import { asyncHandler } from "../middleware/async-handler.js";
import { requireCollegeAccess, requireRole } from "../middleware/auth-middleware.js";

const mediaTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/avif", "avif"],
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
  ["video/quicktime", "mov"],
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

export const mediaRouter = Router();

const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: { message: "A media file is required" } });
  }

  const extension = mediaTypes.get(req.file.mimetype);
  if (!extension) {
    return res.status(400).json({ error: { message: "Upload a JPEG, PNG, WebP, GIF, AVIF, MP4, WebM, or MOV file" } });
  }

  const { S3_BUCKET, S3_PUBLIC_BASE_URL, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
  if (!S3_BUCKET || !S3_PUBLIC_BASE_URL || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
    return res.status(503).json({ error: { message: "Media storage is not configured on the server" } });
  }

  const client = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
  });
  const key = `college-media/${randomUUID()}.${extension}`;

  await client.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
    CacheControl: "public, max-age=31536000, immutable",
  }));

  res.status(201).json({
    data: {
      url: `${S3_PUBLIC_BASE_URL.replace(/\/+$/, "")}/${key}`,
    },
  });
});

mediaRouter.post("/admin/uploads/media", requireRole("Admin"), upload.single("file"), uploadMedia);
mediaRouter.post("/college-dashboard/colleges/:id/uploads/media", requireCollegeAccess, upload.single("file"), uploadMedia);
