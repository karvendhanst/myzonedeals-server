import express from "express";
import {
  getCategories,
  getCategoryTree,
  getCategoryBySlug,
  createCategory,
  updateCategory,
} from "../controllers/category.controller.js";
import { protect, requireRole } from "../middleware/auth.middleware.js";

const categoryRouter = express.Router();

/* ─── Public routes ─── */
categoryRouter.get("/", getCategories);
categoryRouter.get("/tree", getCategoryTree);
categoryRouter.get("/:slug", getCategoryBySlug);

/* ─── Admin-only routes ─── */
categoryRouter.post("/", protect, requireRole("admin"), createCategory);
categoryRouter.patch("/:id", protect, requireRole("admin"), updateCategory);

export default categoryRouter;
