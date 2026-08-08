import express from "express";
import multer from "multer";
import { getProfile, updateProfile, uploadProfilePicture } from "../controllers/dealer.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const dealerRouter = express.Router();

// Memory storage for profile picture — same pattern as deal images
const profileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});

// GET /api/dealer/profile
dealerRouter.get("/profile", protect, getProfile);

// PATCH /api/dealer/profile
dealerRouter.patch("/profile", protect, updateProfile);

// POST /api/dealer/profile/picture
dealerRouter.post(
  "/profile/picture",
  protect,
  profileUpload.single("profilePicture"),
  uploadProfilePicture
);

export default dealerRouter;
