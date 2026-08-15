import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

/**
 * protect — verifies the Bearer JWT and attaches req.user.
 *
 * Unchanged interface from the old Dealer-based middleware:
 * req.user is the full User document (minus password).
 * All existing routes that use `protect` continue to work as-is.
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return res.status(401).json({ message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "Token invalid or expired" });
  }
};

/**
 * requireRole(...roles) — role-based access guard.
 *
 * Must be used AFTER `protect` so req.user is available.
 *
 * @example
 *   router.post('/approve', protect, requireRole('admin'), approveHandler);
 *   router.post('/deal',    protect, requireRole('dealer', 'admin'), createDealHandler);
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role ?? "user";
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }
    next();
  };
};
