import jwt from "jsonwebtoken";

/**
 * Generates a signed JWT for the given user.
 *
 * Payload now includes `role` so downstream middleware / policy checks
 * don't need an extra DB round-trip for role enforcement.
 * Old tokens without `role` are still valid — the policy layer treats
 * missing role as 'user' (least privilege).
 */
export const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role ?? "user" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
