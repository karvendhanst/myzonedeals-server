import express from "express";
import multer from "multer";
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getMapListings,
  getNearbyListings,
  submitListing,
  publishListing,
  archiveListing,
  markSold,
  approveListing,
  rejectListing,
} from "../controllers/listing.controller.js";
import { protect, requireRole } from "../middleware/auth.middleware.js";

const listingRouter = express.Router();

/* ─── Shared multer instance for listing media ─── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});

const handleMulterError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError || err.message === "Only image files are allowed") {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
};

/* ──────────────────────────────────────────────────
   Public read routes
────────────────────────────────────────────────── */
listingRouter.get("/", getListings);
listingRouter.get("/map", getMapListings);
listingRouter.get("/nearby", getNearbyListings);
listingRouter.get("/:id", getListingById);

/* ──────────────────────────────────────────────────
   Authenticated owner routes
────────────────────────────────────────────────── */
listingRouter.post(
  "/",
  protect,
  upload.array("images", 10),
  handleMulterError,
  createListing
);

listingRouter.patch(
  "/:id",
  protect,
  upload.array("images", 10),
  handleMulterError,
  updateListing
);

listingRouter.delete("/:id", protect, deleteListing);

/* Lifecycle transitions (owner) */
listingRouter.post("/:id/submit", protect, submitListing);
listingRouter.post("/:id/publish", protect, publishListing);
listingRouter.post("/:id/archive", protect, archiveListing);
listingRouter.post("/:id/mark-sold", protect, markSold);

/* ──────────────────────────────────────────────────
   Admin-only moderation routes
────────────────────────────────────────────────── */
listingRouter.post(
  "/:id/approve",
  protect,
  requireRole("admin"),
  approveListing
);

listingRouter.post(
  "/:id/reject",
  protect,
  requireRole("admin"),
  rejectListing
);

export default listingRouter;
