/**
 * listing.controller.js
 *
 * Thin controller — delegates all business logic to listing.service.js.
 * Handles HTTP request/response shaping only.
 */

import * as listingService from "../services/listing.service.js";

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const sendSuccess = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, ...data });

/* ── Consistent error handler ── */
const handleServiceError = (err, res) => {
  const status = err.statusCode ?? 500;
  return res.status(status).json({ success: false, message: err.message });
};

/* ════════════════════════════════════════════════
   POST /api/listings
════════════════════════════════════════════════ */
export const createListing = asyncHandler(async (req, res) => {
  try {
    const result = await listingService.createListing(
      req.user,
      req.body,
      req.files ?? []
    );
    return sendSuccess(res, result, 201);
  } catch (err) {
    return handleServiceError(err, res);
  }
});

/* ════════════════════════════════════════════════
   GET /api/listings
════════════════════════════════════════════════ */
export const getListings = asyncHandler(async (req, res) => {
  const result = await listingService.getListings(req.query);
  return sendSuccess(res, result);
});

/* ════════════════════════════════════════════════
   GET /api/listings/map
════════════════════════════════════════════════ */
export const getMapListings = asyncHandler(async (req, res) => {
  const result = await listingService.getMapListings(req.query);
  return sendSuccess(res, result);
});

/* ════════════════════════════════════════════════
   GET /api/listings/nearby
════════════════════════════════════════════════ */
export const getNearbyListings = asyncHandler(async (req, res) => {
  try {
    const result = await listingService.getNearbyListings(req.query);
    return sendSuccess(res, result);
  } catch (err) {
    return handleServiceError(err, res);
  }
});

/* ════════════════════════════════════════════════
   GET /api/listings/:id
════════════════════════════════════════════════ */
export const getListingById = asyncHandler(async (req, res) => {
  try {
    const result = await listingService.getListingById(req.params.id);
    return sendSuccess(res, result);
  } catch (err) {
    return handleServiceError(err, res);
  }
});

/* ════════════════════════════════════════════════
   PATCH /api/listings/:id
════════════════════════════════════════════════ */
export const updateListing = asyncHandler(async (req, res) => {
  try {
    const result = await listingService.updateListing(
      req.user,
      req.params.id,
      req.body,
      req.files ?? []
    );
    return sendSuccess(res, result);
  } catch (err) {
    return handleServiceError(err, res);
  }
});

/* ════════════════════════════════════════════════
   DELETE /api/listings/:id
════════════════════════════════════════════════ */
export const deleteListing = asyncHandler(async (req, res) => {
  try {
    const result = await listingService.deleteListing(req.user, req.params.id);
    return sendSuccess(res, result);
  } catch (err) {
    return handleServiceError(err, res);
  }
});

/* ════════════════════════════════════════════════
   POST /api/listings/:id/submit
════════════════════════════════════════════════ */
export const submitListing = asyncHandler(async (req, res) => {
  try {
    const result = await listingService.submitListing(req.user, req.params.id);
    return sendSuccess(res, result);
  } catch (err) {
    return handleServiceError(err, res);
  }
});

/* ════════════════════════════════════════════════
   POST /api/listings/:id/publish
════════════════════════════════════════════════ */
export const publishListing = asyncHandler(async (req, res) => {
  try {
    const result = await listingService.transitionStatus(
      req.user,
      req.params.id,
      "PUBLISHED"
    );
    return sendSuccess(res, result);
  } catch (err) {
    return handleServiceError(err, res);
  }
});

/* ════════════════════════════════════════════════
   POST /api/listings/:id/archive
════════════════════════════════════════════════ */
export const archiveListing = asyncHandler(async (req, res) => {
  try {
    const result = await listingService.transitionStatus(
      req.user,
      req.params.id,
      "ARCHIVED"
    );
    return sendSuccess(res, result);
  } catch (err) {
    return handleServiceError(err, res);
  }
});

/* ════════════════════════════════════════════════
   POST /api/listings/:id/mark-sold
════════════════════════════════════════════════ */
export const markSold = asyncHandler(async (req, res) => {
  try {
    const result = await listingService.transitionStatus(
      req.user,
      req.params.id,
      "SOLD"
    );
    return sendSuccess(res, result);
  } catch (err) {
    return handleServiceError(err, res);
  }
});

/* ════════════════════════════════════════════════
   POST /api/listings/:id/approve   [Admin]
════════════════════════════════════════════════ */
export const approveListing = asyncHandler(async (req, res) => {
  try {
    const result = await listingService.approveListing(
      req.user,
      req.params.id,
      req.body.reviewReason
    );
    return sendSuccess(res, result);
  } catch (err) {
    return handleServiceError(err, res);
  }
});

/* ════════════════════════════════════════════════
   POST /api/listings/:id/reject   [Admin]
════════════════════════════════════════════════ */
export const rejectListing = asyncHandler(async (req, res) => {
  try {
    const result = await listingService.rejectListing(
      req.user,
      req.params.id,
      req.body.rejectionReason
    );
    return sendSuccess(res, result);
  } catch (err) {
    return handleServiceError(err, res);
  }
});
