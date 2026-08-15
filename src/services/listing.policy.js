/**
 * listing.policy.js
 *
 * Centralised authorisation and verification rules for listings.
 *
 * ALL listing permission checks live here — controllers and services
 * import from this file rather than scattering if/else role checks.
 */

/* ─────────────────────────────────────────────────────────────
   Verification level required per listing type
   ───────────────────────────────────────────────────────────── */
const REQUIRED_VERIFICATION = {
  SELL:     "ACCOUNT_VERIFIED",   // email OTP verified is enough
  GIVEAWAY: "ACCOUNT_VERIFIED",
  RENT:     "ACCOUNT_VERIFIED",   // property rent can be tightened later
  EVENT:    "LISTING_REVIEW",     // needs moderation pass
  SERVICE:  "LISTING_REVIEW",
  DEAL:     "SHOP_VERIFIED",      // must come from a verified Shop
};

/**
 * Returns the verification level required to publish a listing of
 * the given type.
 *
 * @param {string} listingType
 * @returns {string}
 */
export function requiredVerificationLevel(listingType) {
  return REQUIRED_VERIFICATION[listingType] ?? "ACCOUNT_VERIFIED";
}

/* ─────────────────────────────────────────────────────────────
   State transition rules
   Valid transitions only — anything else is rejected.
   ───────────────────────────────────────────────────────────── */
const ALLOWED_TRANSITIONS = {
  DRAFT:          ["SUBMITTED", "DELETED"],
  SUBMITTED:      ["PENDING_REVIEW", "DRAFT", "DELETED"],
  PENDING_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED:       ["PUBLISHED", "ACTIVE"],
  PUBLISHED:      ["ACTIVE", "ARCHIVED", "EXPIRED", "DELETED"],
  ACTIVE:         ["SOLD", "RENTED", "COMPLETED", "ARCHIVED", "EXPIRED", "DELETED"],
  REJECTED:       ["DRAFT", "DELETED"],
  EXPIRED:        ["DRAFT", "ARCHIVED", "DELETED"],
  SOLD:           ["ARCHIVED", "DELETED"],
  RENTED:         ["ACTIVE", "ARCHIVED", "DELETED"],
  COMPLETED:      ["ARCHIVED", "DELETED"],
  ARCHIVED:       ["DELETED"],
  DELETED:        [],
};

/**
 * Returns true if transitioning from `from` to `to` is valid.
 *
 * @param {string} from  current status
 * @param {string} to    desired status
 * @returns {boolean}
 */
export function isValidTransition(from, to) {
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
}

/* ─────────────────────────────────────────────────────────────
   Creation permission
   ───────────────────────────────────────────────────────────── */

/**
 * Can `user` create a listing of the given type?
 *
 * @param {object} user       req.user from auth middleware
 * @param {string} listingType
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canCreateListing(user, listingType) {
  if (!user) {
    return { allowed: false, reason: "Authentication required" };
  }

  if (!user.isVerified) {
    return { allowed: false, reason: "Email verification required" };
  }

  return { allowed: true };
}

/* ─────────────────────────────────────────────────────────────
   Modification permission
   ───────────────────────────────────────────────────────────── */

/**
 * Can `user` modify/delete `listing`?
 *
 * @param {object} user
 * @param {object} listing  Mongoose document (or plain object with owner.userId)
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canModifyListing(user, listing) {
  if (!user) return { allowed: false, reason: "Authentication required" };
  if (user.role === "admin") return { allowed: true };

  const ownerId = listing.owner?.userId?.toString();
  if (ownerId !== user._id.toString()) {
    return { allowed: false, reason: "You do not own this listing" };
  }

  return { allowed: true };
}

/* ─────────────────────────────────────────────────────────────
   Publish permission
   ───────────────────────────────────────────────────────────── */

/**
 * Can `user` publish `listing`?
 *
 * Listings that require ADMIN_APPROVED or LISTING_REVIEW can only be
 * published by an admin.
 *
 * @param {object} user
 * @param {object} listing
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canPublishListing(user, listing) {
  if (!user) return { allowed: false, reason: "Authentication required" };

  const level = listing.verification?.level ?? "NONE";
  const adminOnlyLevels = ["ADMIN_APPROVED", "LISTING_REVIEW", "SHOP_VERIFIED"];

  if (adminOnlyLevels.includes(level) && user.role !== "admin") {
    return {
      allowed: false,
      reason: "This listing requires admin approval before publishing",
    };
  }

  return canModifyListing(user, listing);
}

/* ─────────────────────────────────────────────────────────────
   Status auto-routing
   Determines what status to set after a listing is submitted,
   based on the required verification level.
   ───────────────────────────────────────────────────────────── */

/**
 * Given a listingType, returns the initial status after submission.
 *
 * - Low-risk types auto-advance to PUBLISHED.
 * - Types requiring review go to PENDING_REVIEW.
 * - DEAL types go to PENDING_REVIEW (admin approves).
 *
 * @param {string} listingType
 * @returns {string} status
 */
export function initialStatusAfterSubmit(listingType) {
  const level = requiredVerificationLevel(listingType);

  switch (level) {
    case "ACCOUNT_VERIFIED":
      return "PUBLISHED"; // auto-publish low-risk listings
    case "LISTING_REVIEW":
    case "SHOP_VERIFIED":
    case "ADMIN_APPROVED":
    default:
      return "PENDING_REVIEW";
  }
}
