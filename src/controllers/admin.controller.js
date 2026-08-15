/**
 * admin.controller.js
 *
 * Platform moderation — list all listings, manage reports, verify shops.
 * All routes are guarded by protect + requireRole('admin').
 */

import Listing from "../models/Listing.model.js";
import ListingReport from "../models/ListingReport.model.js";
import Shop from "../models/Shop.model.js";
import User from "../models/User.model.js";
import * as listingService from "../services/listing.service.js";

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const sendSuccess = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, ...data });

const sendError = (res, message, statusCode = 400) =>
  res.status(statusCode).json({ success: false, message });

/* ════════════════════════════════════════════════
   GET /api/admin/listings
   All listings with rich filtering for moderation
════════════════════════════════════════════════ */
export const adminGetListings = asyncHandler(async (req, res) => {
  const {
    listingType,
    category,
    status,
    ownerId,
    shopId,
    page = 1,
    limit = 20,
    sort = "-createdAt",
    search,
  } = req.query;

  const filter = { isDeleted: false };
  if (listingType) filter.listingType = listingType;
  if (category) filter.category = category;
  if (status) filter.status = { $in: status.split(",") };
  if (ownerId) filter["owner.userId"] = ownerId;
  if (shopId) filter["source.shopId"] = shopId;
  if (search) filter.title = { $regex: search, $options: "i" };

  const skip = (Number(page) - 1) * Number(limit);

  const [listings, total] = await Promise.all([
    Listing.find(filter)
      .populate("category", "name slug")
      .populate("owner.userId", "name email role")
      .populate("source.shopId", "name isVerified status")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    Listing.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    listings,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
});

/* ════════════════════════════════════════════════
   POST /api/admin/listings/:id/approve
════════════════════════════════════════════════ */
export const adminApproveListing = asyncHandler(async (req, res) => {
  try {
    const result = await listingService.approveListing(
      req.user,
      req.params.id,
      req.body.reviewReason
    );
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message, err.statusCode ?? 400);
  }
});

/* ════════════════════════════════════════════════
   POST /api/admin/listings/:id/reject
════════════════════════════════════════════════ */
export const adminRejectListing = asyncHandler(async (req, res) => {
  try {
    const result = await listingService.rejectListing(
      req.user,
      req.params.id,
      req.body.rejectionReason
    );
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message, err.statusCode ?? 400);
  }
});

/* ════════════════════════════════════════════════
   POST /api/admin/listings/:id/suspend
════════════════════════════════════════════════ */
export const adminSuspendListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findOne({ _id: req.params.id, isDeleted: false });
  if (!listing) return sendError(res, "Listing not found", 404);

  listing.status = "ARCHIVED";
  listing.verification.reviewedBy = req.user._id;
  listing.verification.reviewedAt = new Date();
  listing.verification.reviewReason = req.body.reason ?? "Suspended by admin";
  await listing.save();

  return sendSuccess(res, { listing });
});

/* ════════════════════════════════════════════════
   GET /api/admin/reports
   All listing reports (pending first)
════════════════════════════════════════════════ */
export const adminGetReports = asyncHandler(async (req, res) => {
  const { status = "pending", page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status !== "all") filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [reports, total] = await Promise.all([
    ListingReport.find(filter)
      .populate("listingId", "title listingType status")
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    ListingReport.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    reports,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
});

/* ════════════════════════════════════════════════
   PATCH /api/admin/reports/:id
   Review a report (mark reviewed or dismissed)
════════════════════════════════════════════════ */
export const adminReviewReport = asyncHandler(async (req, res) => {
  const { status, reviewNote } = req.body;
  if (!["reviewed", "dismissed"].includes(status)) {
    return sendError(res, "status must be 'reviewed' or 'dismissed'");
  }

  const report = await ListingReport.findById(req.params.id);
  if (!report) return sendError(res, "Report not found", 404);

  report.status = status;
  report.reviewedBy = req.user._id;
  report.reviewedAt = new Date();
  report.reviewNote = reviewNote ?? null;
  await report.save();

  return sendSuccess(res, { report });
});

/* ════════════════════════════════════════════════
   GET /api/admin/shops
   All shops with verification status
════════════════════════════════════════════════ */
export const adminGetShops = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [shops, total] = await Promise.all([
    Shop.find(filter)
      .populate("dealerId", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Shop.countDocuments(filter),
  ]);

  return sendSuccess(res, { shops, total, page: Number(page) });
});

/* ════════════════════════════════════════════════
   POST /api/admin/shops/:shopId/verify
   Verify a shop (sets isVerified + status: active)
════════════════════════════════════════════════ */
export const adminVerifyShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.shopId);
  if (!shop) return sendError(res, "Shop not found", 404);

  shop.isVerified = true;
  shop.status = "active";
  await shop.save();

  return sendSuccess(res, { shop });
});

/* ════════════════════════════════════════════════
   POST /api/admin/shops/:shopId/suspend
════════════════════════════════════════════════ */
export const adminSuspendShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.shopId);
  if (!shop) return sendError(res, "Shop not found", 404);

  shop.status = "suspended";
  shop.isVerified = false;
  await shop.save();

  return sendSuccess(res, { shop });
});

/* ════════════════════════════════════════════════
   GET /api/admin/users
   All users for admin view
════════════════════════════════════════════════ */
export const adminGetUsers = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 20, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password -otp -otpExpiry")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  return sendSuccess(res, { users, total, page: Number(page) });
});

/* ════════════════════════════════════════════════
   PATCH /api/admin/users/:userId/role
   Change a user's role
════════════════════════════════════════════════ */
export const adminSetUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["user", "dealer", "admin"].includes(role)) {
    return sendError(res, "Invalid role");
  }

  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { role },
    { new: true }
  ).select("-password -otp -otpExpiry");

  if (!user) return sendError(res, "User not found", 404);

  return sendSuccess(res, { user });
});
