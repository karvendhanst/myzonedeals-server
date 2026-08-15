import express from "express";
import { protect, requireRole } from "../middleware/auth.middleware.js";
import {
  adminGetListings,
  adminApproveListing,
  adminRejectListing,
  adminSuspendListing,
  adminGetReports,
  adminReviewReport,
  adminGetShops,
  adminVerifyShop,
  adminSuspendShop,
  adminGetUsers,
  adminSetUserRole,
} from "../controllers/admin.controller.js";

const adminRouter = express.Router();

/* All admin routes require authentication + admin role */
adminRouter.use(protect, requireRole("admin"));

/* ── Listing moderation ── */
adminRouter.get("/listings", adminGetListings);
adminRouter.post("/listings/:id/approve", adminApproveListing);
adminRouter.post("/listings/:id/reject", adminRejectListing);
adminRouter.post("/listings/:id/suspend", adminSuspendListing);

/* ── Reports ── */
adminRouter.get("/reports", adminGetReports);
adminRouter.patch("/reports/:id", adminReviewReport);

/* ── Shop management ── */
adminRouter.get("/shops", adminGetShops);
adminRouter.post("/shops/:shopId/verify", adminVerifyShop);
adminRouter.post("/shops/:shopId/suspend", adminSuspendShop);

/* ── User management ── */
adminRouter.get("/users", adminGetUsers);
adminRouter.patch("/users/:userId/role", adminSetUserRole);

export default adminRouter;
