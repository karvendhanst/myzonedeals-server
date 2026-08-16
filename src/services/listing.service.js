/**
 * listing.service.js
 *
 * Business logic for listings — called by the controller.
 * The controller stays thin; all DB queries and rules live here.
 */

import Listing from "../models/Listing.model.js";
import Shop from "../models/Shop.model.js";
import {
  canCreateListing,
  canModifyListing,
  isValidTransition,
  initialStatusAfterSubmit,
  requiredVerificationLevel,
} from "./listing.policy.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

/* ─── helpers ─── */
const PAGE_SIZE = 20;

/* ════════════════════════════════════════════════════════════
   CREATE
════════════════════════════════════════════════════════════ */

/**
 * createListing
 *
 * @param {object} user     req.user
 * @param {object} body     validated request body
 * @param {Array}  files    multer files (images)
 * @returns {Promise<{listing: Listing}>}
 * @throws {Error} with statusCode property
 */
export async function createListing(user, body, files = []) {
  const { listingType, source } = body;

  /* ── 1. Permission check ── */
  const { allowed, reason } = canCreateListing(user, listingType);
  if (!allowed) {
    const err = new Error(reason);
    err.statusCode = 403;
    throw err;
  }

  /* ── 2. DEAL type: verify Shop ownership ── */
  let resolvedSource = { type: "INDIVIDUAL", shopId: null };

  if (listingType === "DEAL") {
    if (!source?.shopId) {
      const err = new Error("shopId is required for DEAL listings");
      err.statusCode = 400;
      throw err;
    }

    const shop = await Shop.findOne({
      _id: source.shopId,
      dealerId: user._id,
    });

    if (!shop) {
      const err = new Error(
        "Shop not found or you do not own this shop"
      );
      err.statusCode = 403;
      throw err;
    }

    if (!shop.isVerified) {
      const err = new Error(
        "Shop must be verified before posting DEAL listings"
      );
      err.statusCode = 403;
      throw err;
    }

    resolvedSource = { type: "SHOP", shopId: shop._id };
  } else if (source?.shopId) {
    // Non-DEAL can optionally be associated with a shop (e.g. business listing)
    const shop = await Shop.findOne({ _id: source.shopId, dealerId: user._id });
    if (shop) {
      resolvedSource = { type: "SHOP", shopId: shop._id };
    }
  }

  /* ── 3. Upload media ── */
  let media = [];
  if (files.length > 0) {
    if (files.length > 10) {
      const err = new Error("Maximum 10 images per listing");
      err.statusCode = 400;
      throw err;
    }

    const folder = `listings/${listingType.toLowerCase()}`;
    const uploads = await Promise.all(
      files.map((f) =>
        uploadToCloudinary(f.buffer, { folder, resource_type: "image" })
      )
    );
    media = uploads.map((r, idx) => ({
      url: r.secure_url,
      publicId: r.public_id,
      isCover: idx === 0,
    }));
  }

  /* ── 4. Build owner ── */
  const owner = {
    type: user.role === "dealer" ? "DEALER" : "USER",
    userId: user._id,
  };

  /* ── 5. Parse metadata ── */
  let metadata = {};
  try {
    metadata =
      typeof body.metadata === "string"
        ? JSON.parse(body.metadata)
        : body.metadata ?? {};
  } catch {
    const err = new Error("Invalid metadata JSON");
    err.statusCode = 400;
    throw err;
  }

  /* ── 6. Set verification level ── */
  const verificationLevel = requiredVerificationLevel(listingType);

  /* ── 7. Create document ── */
  const listing = await Listing.create({
    owner,
    source: resolvedSource,
    listingType,
    category: body.category || null,
    title: body.title,
    description: body.description ?? "",
    media,
    location: body.location
      ? typeof body.location === "string"
        ? JSON.parse(body.location)
        : body.location
      : undefined,
    status: "DRAFT",
    visibility: body.visibility ?? "PUBLIC",
    verification: { level: verificationLevel },
    metadata,
    expiresAt: resolveExpiresAt(listingType, metadata),
  });

  return { listing };
}

/* ════════════════════════════════════════════════════════════
   SUBMIT (DRAFT → PENDING_REVIEW or PUBLISHED)
════════════════════════════════════════════════════════════ */
export async function submitListing(user, listingId) {
  const listing = await Listing.findOne({ _id: listingId, isDeleted: false });
  if (!listing) throw notFound();

  const { allowed, reason } = canModifyListing(user, listing);
  if (!allowed) throw forbidden(reason);

  if (!isValidTransition(listing.status, "SUBMITTED")) {
    throw badRequest(`Cannot submit a listing with status ${listing.status}`);
  }

  const nextStatus = initialStatusAfterSubmit(listing.listingType);

  listing.status = nextStatus;
  await listing.save();
  return { listing };
}

/* ════════════════════════════════════════════════════════════
   GET MANY
════════════════════════════════════════════════════════════ */
export async function getListings(query) {
  const {
    listingType,
    category,
    status = "PUBLISHED,ACTIVE",
    ownerId,
    shopId,
    page = 1,
    limit = PAGE_SIZE,
    sort = "-createdAt",
  } = query;

  const filter = { isDeleted: false };
  const statuses = status.split(",");
  filter.status = { $in: statuses };

  if (listingType) filter.listingType = listingType;
  if (category) filter.category = category;
  if (ownerId) filter["owner.userId"] = ownerId;
  if (shopId) filter["source.shopId"] = shopId;

  const skip = (Number(page) - 1) * Number(limit);

  const [listings, total] = await Promise.all([
    Listing.find(filter)
      .populate("category", "name slug icon")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    Listing.countDocuments(filter),
  ]);

  return { listings, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
}

/* ════════════════════════════════════════════════════════════
   GET ONE
════════════════════════════════════════════════════════════ */
export async function getListingById(listingId) {
  const listing = await Listing.findOne({ _id: listingId, isDeleted: false })
    .populate("category", "name slug icon")
    .populate("owner.userId", "name profilePicture")
    .populate("source.shopId", "name shopImage address location");

  if (!listing) throw notFound();
  return { listing };
}

/* ════════════════════════════════════════════════════════════
   UPDATE
════════════════════════════════════════════════════════════ */
export async function updateListing(user, listingId, body, files = []) {
  const listing = await Listing.findOne({ _id: listingId, isDeleted: false });
  if (!listing) throw notFound();

  const { allowed, reason } = canModifyListing(user, listing);
  if (!allowed) throw forbidden(reason);

  // Allowed editable fields (never trust status/verification from client)
  const editable = ["title", "description", "visibility", "category", "expiresAt"];
  editable.forEach((key) => {
    if (body[key] !== undefined) listing[key] = body[key];
  });

  // Location update
  if (body.location) {
    listing.location =
      typeof body.location === "string" ? JSON.parse(body.location) : body.location;
  }

  // Metadata update (merge, not replace)
  if (body.metadata) {
    const incoming =
      typeof body.metadata === "string" ? JSON.parse(body.metadata) : body.metadata;
    listing.metadata = { ...listing.metadata.toObject(), ...incoming };
  }

  // New media upload
  if (files.length > 0) {
    const folder = `listings/${listing.listingType.toLowerCase()}`;
    const uploads = await Promise.all(
      files.map((f) =>
        uploadToCloudinary(f.buffer, { folder, resource_type: "image" })
      )
    );
    const newMedia = uploads.map((r, idx) => ({
      url: r.secure_url,
      publicId: r.public_id,
      isCover: listing.media.length === 0 && idx === 0,
    }));
    listing.media = [...listing.media, ...newMedia].slice(0, 10);
  }

  await listing.save();
  return { listing };
}

/* ════════════════════════════════════════════════════════════
   DELETE (soft)
════════════════════════════════════════════════════════════ */
export async function deleteListing(user, listingId) {
  const listing = await Listing.findOne({ _id: listingId, isDeleted: false });
  if (!listing) throw notFound();

  const { allowed, reason } = canModifyListing(user, listing);
  if (!allowed) throw forbidden(reason);

  listing.isDeleted = true;
  listing.status = "DELETED";

  // Delete media from Cloudinary
  if (listing.media.length) {
    await Promise.allSettled(
      listing.media
        .filter((m) => m.publicId)
        .map((m) => deleteFromCloudinary(m.publicId))
    );
  }

  await listing.save();
  return { message: "Listing deleted successfully" };
}

/* ════════════════════════════════════════════════════════════
   STATUS TRANSITION (generic — used by publish, archive, etc.)
════════════════════════════════════════════════════════════ */
export async function transitionStatus(user, listingId, toStatus) {
  const listing = await Listing.findOne({ _id: listingId, isDeleted: false });
  if (!listing) throw notFound();

  const { allowed, reason } = canModifyListing(user, listing);
  if (!allowed) throw forbidden(reason);

  if (!isValidTransition(listing.status, toStatus)) {
    throw badRequest(
      `Cannot transition from ${listing.status} to ${toStatus}`
    );
  }

  listing.status = toStatus;
  await listing.save();
  return { listing };
}

/* ════════════════════════════════════════════════════════════
   MAP / GEO QUERY
════════════════════════════════════════════════════════════ */
export async function getMapListings(query) {
  const {
    latitude,
    longitude,
    radius = 10000, // default 10 km in meters
    type,           // listingType filter (comma-separated)
    category,
    status = "PUBLISHED,ACTIVE",
  } = query;

  const statuses = status.split(",");

  const matchFilter = {
    isDeleted: false,
    status: { $in: statuses },
    "location.coordinates": { $exists: true },
  };

  if (type) matchFilter.listingType = { $in: type.split(",") };
  if (category) matchFilter.category = new Listing.base.Types.ObjectId(category);

  // If lat/lng provided — use $geoNear; otherwise return all live listings
  if (latitude && longitude) {
    const results = await Listing.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          distanceField: "distance",
          maxDistance: Number(radius),
          spherical: true,
          query: matchFilter,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "shops",
          localField: "source.shopId",
          foreignField: "_id",
          as: "shopInfo",
        },
      },
      { $unwind: { path: "$shopInfo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "owner.userId",
          foreignField: "_id",
          as: "ownerInfo",
        },
      },
      { $unwind: { path: "$ownerInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          listingType: 1,
          title: 1,
          description: 1,
          media: 1,
          status: 1,
          metadata: 1,
          "owner.type": 1,
          "owner.userId": 1,
          ownerName: "$ownerInfo.name",
          profilePicture: "$ownerInfo.profilePicture",
          "source.type": 1,
          shopId: { $toString: "$source.shopId" },
          shopName: "$shopInfo.name",
          shopImage: "$shopInfo.shopImage",
          categoryName: "$categoryInfo.name",
          categoryIcon: "$categoryInfo.icon",
          latitude: { $arrayElemAt: ["$location.coordinates", 1] },
          longitude: { $arrayElemAt: ["$location.coordinates", 0] },
          address: "$location.address",
          distance: 1,
          createdAt: 1,
        },
      },
      { $sort: { distance: 1 } },
      { $limit: 500 },
    ]);

    return { listings: results, count: results.length };
  }

  // No geo — return recent listings
  const listings = await Listing.find(matchFilter)
    .populate("category", "name slug icon")
    .populate("owner.userId", "name profilePicture")
    .sort({ createdAt: -1 })
    .limit(500);

  return { listings, count: listings.length };
}

/* ════════════════════════════════════════════════════════════
   NEARBY (proximity search — user feed)
════════════════════════════════════════════════════════════ */
export async function getNearbyListings(query) {
  const { latitude, longitude, radius = 5000, type, page = 1, limit = PAGE_SIZE } = query;

  if (!latitude || !longitude) {
    throw badRequest("latitude and longitude are required");
  }

  const matchFilter = {
    isDeleted: false,
    status: { $in: ["PUBLISHED", "ACTIVE"] },
    "location.coordinates": { $exists: true },
  };
  if (type) matchFilter.listingType = type;

  const skip = (Number(page) - 1) * Number(limit);

  const results = await Listing.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        distanceField: "distance",
        maxDistance: Number(radius),
        spherical: true,
        query: matchFilter,
      },
    },
    { $skip: skip },
    { $limit: Number(limit) },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "categoryInfo",
      },
    },
    { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
  ]);

  return { listings: results, count: results.length, page: Number(page) };
}

/* ════════════════════════════════════════════════════════════
   Admin: approve / reject
════════════════════════════════════════════════════════════ */
export async function approveListing(adminUser, listingId, reviewReason = "") {
  const listing = await Listing.findOne({ _id: listingId, isDeleted: false });
  if (!listing) throw notFound();

  if (!isValidTransition(listing.status, "APPROVED")) {
    throw badRequest(`Cannot approve listing with status ${listing.status}`);
  }

  listing.status = "APPROVED";
  listing.verification.reviewedBy = adminUser._id;
  listing.verification.reviewedAt = new Date();
  listing.verification.reviewReason = reviewReason;
  listing.verification.rejectionReason = null;
  await listing.save();
  return { listing };
}

export async function rejectListing(adminUser, listingId, rejectionReason) {
  if (!rejectionReason) throw badRequest("rejectionReason is required");

  const listing = await Listing.findOne({ _id: listingId, isDeleted: false });
  if (!listing) throw notFound();

  if (!isValidTransition(listing.status, "REJECTED")) {
    throw badRequest(`Cannot reject listing with status ${listing.status}`);
  }

  listing.status = "REJECTED";
  listing.verification.reviewedBy = adminUser._id;
  listing.verification.reviewedAt = new Date();
  listing.verification.rejectionReason = rejectionReason;
  await listing.save();
  return { listing };
}

/* ─────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */

/** Auto-compute expiresAt based on listing type */
function resolveExpiresAt(listingType, metadata) {
  switch (listingType) {
    case "DEAL":
      return metadata.validUntil ? new Date(metadata.validUntil) : null;
    case "EVENT":
      return metadata.endDate ? new Date(metadata.endDate) : null;
    case "SELL":
    case "GIVEAWAY":
      return addDays(60);
    case "RENT":
      return addDays(90);
    case "SERVICE":
      return addDays(90);
    default:
      return addDays(30);
  }
}

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function notFound() {
  const e = new Error("Listing not found");
  e.statusCode = 404;
  return e;
}

function forbidden(reason = "Forbidden") {
  const e = new Error(reason);
  e.statusCode = 403;
  return e;
}

function badRequest(reason) {
  const e = new Error(reason);
  e.statusCode = 400;
  return e;
}
