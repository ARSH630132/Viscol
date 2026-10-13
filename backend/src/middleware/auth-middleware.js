import { getSessionToken } from "../auth.js";
import { prisma } from "../db.js";

export const ADMIN_MOBILES = new Set(["6306113500", "9555410125"]);

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
      u.email,
      u.role
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

  const role = ADMIN_MOBILES.has(session.mobile) ? "Admin" : session.role;
  return {
    id: session.id,
    name: session.name,
    mobile: session.mobile,
    email: session.email,
    role,
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

export const requireRole = (...roles) => async (req, res, next) => {
  try {
    const user = await getRequestUser(req);
    if (!user) return res.status(401).json({ error: "Registration required" });
    if (!roles.includes(user.role)) return res.status(403).json({ error: "You do not have permission to perform this action" });
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

export const requireCollegeAccess = async (req, res, next) => {
  try {
    const user = req.user || (await getRequestUser(req));
    if (!user) return res.status(401).json({ error: "Registration required" });
    if (user.role === "Admin") {
      req.user = user;
      return next();
    }
    if (user.role !== "College") return res.status(403).json({ error: "College access is required" });
    const collegeId = Number(req.params.id);
    const access = await prisma.collegeAccess.findUnique({ where: { userId_collegeId: { userId: user.id, collegeId } } });
    if (!access) return res.status(403).json({ error: "You can only manage colleges assigned to your account" });
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};
