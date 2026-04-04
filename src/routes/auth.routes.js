import express from "express";
import { register, verifyOtp, login, resendOtp } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/verify-otp", verifyOtp);
authRouter.post("/resend-otp", resendOtp);
authRouter.post("/login", login);

authRouter.get("/profile", protect, (req, res) => {
  res.json({ user: req.user });
});

export default authRouter;
