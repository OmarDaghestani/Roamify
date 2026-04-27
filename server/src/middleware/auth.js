import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { User } from "../models/User.js";

export function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export async function loadUser(req, res, next) {
  try {
    const user = await User.findById(req.userId).select("-passwordHash");
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = user;
    next();
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
}

export function signToken(userId) {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: "7d" });
}
