import crypto from "crypto";
import { Router } from "express";
import nodemailer from "nodemailer";

import { clearSessionCookie, createSessionToken, getSessionToken, SESSION_DURATION_MS, setSessionCookie } from "../auth.js";
import { prisma } from "../db.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { getRequestUser } from "../middleware/auth-middleware.js";
import { registerSchema, verifyOtpSchema } from "../validators.js";

export const authRouter = Router();

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_RESEND_WAIT_MS = 60 * 1000;
const OTP_MAX_REQUESTS = 5;
const OTP_REQUEST_WINDOW_MS = 10 * 60 * 1000;
const OTP_MAX_VERIFY_ATTEMPTS = 5;

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  mobile: user.mobile,
  email: user.email,
});

const createUserSession = async (res, userId) => {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.$executeRaw`
    DELETE FROM sessions
    WHERE user_id = ${userId} OR expires_at <= ${new Date()}
  `;

  await prisma.$executeRaw`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt})
  `;
  setSessionCookie(res, token);
};

const hashOtp = ({ email, mobile, otp }) =>
  crypto
    .createHash("sha256")
    .update(`${email}:${mobile}:${otp}:${process.env.SMTP_PASS || process.env.DATABASE_URL || "college-visitor"}`)
    .digest("hex");

const createOtp = () => String(crypto.randomInt(100000, 1000000));

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
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });

const sendOtpEmail = async ({ email, name, otp }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    const error = new Error("SMTP is not configured");
    error.status = 500;
    throw error;
  }

  await mailTransport().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "College Visitor verification code",
    text: `Hi ${name}, your College Visitor verification code is ${otp}. It expires in 5 minutes.`,
    html: `<p>Hi ${name},</p><p>Your College Visitor verification code is <strong>${otp}</strong>.</p><p>This code expires in 5 minutes.</p>`,
  });
};

const getExistingAuthUser = async (input) => {
  const users = await prisma.$queryRaw`
    SELECT id, name, mobile, email
    FROM users
    WHERE mobile = ${input.mobile} OR email = ${input.email}
    ORDER BY id ASC
  `;

  if (users.length > 1) {
    const error = new Error("Mobile or email already registered with different details");
    error.status = 400;
    throw error;
  }

  return users[0];
};

const findOrCreateUser = async (input) => {
  const now = new Date();
  const user = await getExistingAuthUser(input);

  if (user) {
    const updatedUsers = await prisma.$queryRaw`
      UPDATE users
      SET name = ${input.name},
          mobile = ${input.mobile},
          email = ${input.email},
          last_login = ${now},
          updated_at = ${now}
      WHERE id = ${user.id}
      RETURNING id, name, mobile, email
    `;
    return updatedUsers[0];
  }

  const createdUsers = await prisma.$queryRaw`
    INSERT INTO users (name, mobile, email, last_login, updated_at)
    VALUES (${input.name}, ${input.mobile}, ${input.email}, ${now}, ${now})
    RETURNING id, name, mobile, email
  `;

  return createdUsers[0];
};

authRouter.post(
  "/auth/send-otp",
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const now = new Date();
    const windowStart = new Date(now.getTime() - OTP_REQUEST_WINDOW_MS);

    await getExistingAuthUser(input);

    const recentOtps = await prisma.$queryRaw`
      SELECT id, created_at
      FROM email_otps
      WHERE email = ${input.email}
        AND mobile = ${input.mobile}
        AND created_at >= ${windowStart}
      ORDER BY created_at DESC
    `;

    if (recentOtps.length >= OTP_MAX_REQUESTS) {
      return res.status(429).json({ error: { message: "Please wait before requesting another OTP" } });
    }

    const latestOtp = recentOtps[0];
    if (latestOtp && now.getTime() - new Date(latestOtp.created_at).getTime() < OTP_RESEND_WAIT_MS) {
      return res.status(429).json({ error: { message: "Please wait before requesting another OTP" } });
    }

    const otp = createOtp();
    const otpHash = hashOtp({ email: input.email, mobile: input.mobile, otp });
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);

    await prisma.$executeRaw`
      UPDATE email_otps
      SET used = true
      WHERE email = ${input.email}
        AND mobile = ${input.mobile}
        AND used = false
    `;

    await prisma.$executeRaw`
      INSERT INTO email_otps (name, mobile, email, otp_hash, expires_at)
      VALUES (${input.name}, ${input.mobile}, ${input.email}, ${otpHash}, ${expiresAt})
    `;

    await sendOtpEmail({ email: input.email, name: input.name, otp });
    return res.json({ ok: true, message: "OTP sent" });
  }),
);

authRouter.post(
  "/auth/verify-otp",
  asyncHandler(async (req, res) => {
    const input = verifyOtpSchema.parse(req.body);
    const now = new Date();
    const otpHash = hashOtp({ email: input.email, mobile: input.mobile, otp: input.otp });

    const otpRows = await prisma.$queryRaw`
      SELECT id, otp_hash, expires_at, used, attempts
      FROM email_otps
      WHERE email = ${input.email}
        AND mobile = ${input.mobile}
        AND used = false
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const otpRow = otpRows[0];

    if (!otpRow || otpRow.used || otpRow.expires_at <= now || otpRow.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
      return res.status(400).json({ error: { message: "Invalid or expired OTP" } });
    }

    if (otpRow.otp_hash !== otpHash) {
      await prisma.$executeRaw`
        UPDATE email_otps
        SET attempts = attempts + 1
        WHERE id = ${otpRow.id}
      `;
      return res.status(400).json({ error: { message: "Invalid or expired OTP" } });
    }

    await prisma.$executeRaw`
      UPDATE email_otps
      SET used = true
      WHERE id = ${otpRow.id}
    `;

    const user = await findOrCreateUser(input);
    await createUserSession(res, user.id);
    return res.json({ data: publicUser(user) });
  }),
);

authRouter.post(
  "/auth/register",
  asyncHandler(async (req, res) => {
    registerSchema.parse(req.body);
    return res.status(400).json({ error: { message: "Email OTP verification is required" } });
  }),
);

authRouter.get(
  "/auth/me",
  asyncHandler(async (req, res) => {
    const user = await getRequestUser(req);
    if (!user) {
      return res.status(401).json({ error: "Not registered" });
    }

    return res.json({ data: publicUser(user) });
  }),
);

authRouter.post(
  "/auth/logout",
  asyncHandler(async (req, res) => {
    const token = getSessionToken(req);
    if (token) {
      await prisma.$executeRaw`DELETE FROM sessions WHERE token = ${token}`;
    }
    clearSessionCookie(res);
    res.json({ ok: true });
  }),
);
