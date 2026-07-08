import { Router } from "express";

import { clearSessionCookie, createSessionToken, getSessionToken, SESSION_DURATION_MS, setSessionCookie } from "../auth.js";
import { prisma } from "../db.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { getRequestUser } from "../middleware/auth-middleware.js";
import { registerSchema } from "../validators.js";

export const authRouter = Router();

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  mobile: user.mobile,
  email: user.email,
});

const createUserSession = async (res, userId) => {
  const token = createSessionToken();
  await prisma.$executeRaw`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${new Date(Date.now() + SESSION_DURATION_MS)})
  `;
  setSessionCookie(res, token);
};

authRouter.post(
  "/auth/register",
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const now = new Date();

    const existingUsers = await prisma.$queryRaw`
      SELECT id, name, mobile, email
      FROM users
      WHERE mobile = ${input.mobile} OR email = ${input.email}
      ORDER BY id ASC
      LIMIT 1
    `;

    let user = existingUsers[0];

    if (user) {
      const updatedUsers = await prisma.$queryRaw`
        UPDATE users
        SET last_login = ${now}, updated_at = ${now}
        WHERE id = ${user.id}
        RETURNING id, name, mobile, email
      `;
      user = updatedUsers[0];
    } else {
      const createdUsers = await prisma.$queryRaw`
        INSERT INTO users (name, mobile, email, last_login, updated_at)
        VALUES (${input.name}, ${input.mobile}, ${input.email}, ${now}, ${now})
        RETURNING id, name, mobile, email
      `;
      user = createdUsers[0];
    }

    await createUserSession(res, user.id);
    res.json({ data: publicUser(user) });
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
