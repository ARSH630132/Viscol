import { getSessionToken } from "../auth.js";
import { prisma } from "../db.js";

export const getRequestUser = async (req) => {
  const token = getSessionToken(req);
  if (!token) return null;

  const sessions = await prisma.$queryRaw`
    SELECT
      s.id AS session_id,
      s.expires_at,
      u.id,
      u.name,
      u.mobile,
      u.email
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token}
    LIMIT 1
  `;
  const session = sessions[0];

  if (!session || session.expires_at <= new Date()) {
    if (session) {
      await prisma.$executeRaw`DELETE FROM sessions WHERE id = ${session.session_id}`.catch(() => {});
    }
    return null;
  }

  return {
    id: session.id,
    name: session.name,
    mobile: session.mobile,
    email: session.email,
  };
};

export const requireAuth = async (req, res, next) => {
  try {
    const user = await getRequestUser(req);
    if (!user) {
      return res.status(401).json({ error: "Registration required" });
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};
