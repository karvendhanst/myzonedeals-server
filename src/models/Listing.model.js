import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

/* ─── Media sub-document ─── */
const mediaSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true, default: null },
    isCover: { type: Boolean, default: false },
  },
  { _id: false }
);

/* ─── Location sub-document ─── */
const locationSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, "Coordinates are required"],
      validate: {
        validator: (coords) =>
          coords.length === 2 &&
          coords[0] >= -180 &&
          coords[0] <= 180 &&
          coords[1] >= -90 &&
          coords[1] <= 90,
        message: "Invalid coordinates. Provide [longitude, latitude].",
      },
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      country: { type: String, trim: true, default: "India" },
    },
  },
  { _id: false }
);

/* ─── Metadata sub-document (type-specific fields) ─── */
const metadataSchema = new Schema(
  {
    // ── Shared price fields (SELL / RENT / SERVICE / DEAL)
    price: { type: Number, min: 0 },
    currency: { type: String, default: "INR" },
    negotiable: { type: Boolean },

    // ── SELL specific
    condition: {
      type: String,
      enum: ["new", "like_new", "good", "fair", "poor"],
    },

    // ── RENT specific
    rentalPeriod: {
      type: String,
      enum: ["hourly", "daily", "weekly", "monthly"],
    },
    deposit: { type: Number, min: 0 },
    availabilityDate: { type: Date },

    // ── EVENT specific
    startDate: { type: Date },
    endDate: { type: Date },
    startTime: { type: String },
    endTime: { type: String },
    venue: { type: String, trim: true },
    ticketRequired: { type: Boolean },
    ticketPrice: { type: Number, min: 0 },
    expectedAttendees: { type: Number },

    // ── SERVICE specific
    pricingType: {
      type: String,
      enum: ["fixed", "hourly", "negotiable"],
    },
    availability: { type: String, trim: true },
    serviceArea: { type: String, trim: true },

    // ── DEAL specific (backward-compatible with Deal model)
    dealType: {
      type: String,
      enum: ["discount", "bogo", "freebie", "showcase"],
    },
    dealPrice: { type: Number, min: 0 },
    discountPercent: { type: Number, default: 0 },
    validFrom: { type: Date },
    validUntil: { type: Date },
    bogoDetails: {
      buyQty: { type: Number, min: 1 },
      getQty: { type: Number, min: 1 },
    },
    freebieDetails: {
      itemName: { type: String, trim: true },
    },

    // ── Link back to legacy Deal document (for backward compat)
    legacyDealId: {
      type: Schema.Types.ObjectId,
      ref: "Deal",
      default: null,
    },
  },
  { _id: false }
);

/* ─── Listing schema ─── */
const listingSchema = new Schema(
  {
    /**
     * owner — WHO created/owns this listing.
     * Never set from client — always derived from req.user in the service layer.
     */
    owner: {
      type: {
        type: String,
        enum: ["USER", "DEALER"],
        required: true,
      },
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",       // references the 'dealers' collection (User model)
        required: true,
      },
    },

    /**
     * source — UNDER WHAT CONTEXT is this listing published?
     * shopId is null for individual listings.
     */
    source: {
      type: {
        type: String,
        enum: ["INDIVIDUAL", "SHOP"],
        default: "INDIVIDUAL",
      },
      shopId: {
        type: Schema.Types.ObjectId,
        ref: "Shop",
        default: null,
      },
    },

    listingType: {
      type: String,
      enum: ["SELL", "RENT", "EVENT", "SERVICE", "GIVEAWAY", "DEAL"],
      required: [true, "listingType is required"],
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title must be under 120 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description must be under 2000 characters"],
      default: "",
    },

    media: {
      type: [mediaSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: "Maximum 10 media items per listing",
      },
    },

    location: locationSchema,

    /**
     * Listing lifecycle states.
     * Transitions are enforced in listing.service.js — not here.
     */
    status: {
      type: String,
      enum: [
        "DRAFT",
        "SUBMITTED",
        "PENDING_REVIEW",
        "APPROVED",
        "PUBLISHED",
        "ACTIVE",
        "REJECTED",
        "EXPIRED",
        "SOLD",
        "RENTED",
        "COMPLETED",
        "ARCHIVED",
        "DELETED",
      ],
      default: "DRAFT",
    },

    visibility: {
      type: String,
      enum: ["PUBLIC", "PRIVATE"],
      default: "PUBLIC",
    },

    /**
     * verification — moderation metadata.
     * All fields are server-only; never accepted from client body.
     */
    verification: {
      level: {
        type: String,
        enum: [
          "NONE",
          "ACCOUNT_VERIFIED",
          "LISTING_REVIEW",
          "BUSINESS_VERIFIED",
          "SHOP_VERIFIED",
          "ADMIN_APPROVED",
        ],
        default: "NONE",
      },
      reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
      reviewedAt: { type: Date, default: null },
      reviewReason: { type: String, default: null },
      rejectionReason: { type: String, default: null },
    },

    metadata: {
      type: metadataSchema,
      default: {},
    },

    expiresAt: { type: Date, default: null },

    /* Soft-delete — never exposed in queries by default */
    isDeleted: { type: Boolean, default: false, select: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* ─── Indexes ─── */
listingSchema.index({ "owner.userId": 1 });
listingSchema.index({ listingType: 1, status: 1 });
listingSchema.index({ "source.shopId": 1 });
listingSchema.index({ category: 1 });
listingSchema.index({ location: "2dsphere" });
listingSchema.index({ expiresAt: 1 });
listingSchema.index({ createdAt: -1 });
// Compound for map queries
listingSchema.index({ listingType: 1, status: 1, location: "2dsphere" });

/* ─── Pre-save: compute DEAL discountPercent & mark cover media ─── */
listingSchema.pre("save", function () {
  // Compute discount percent for DEAL listings
  if (
    this.listingType === "DEAL" &&
    this.metadata?.dealType === "discount" &&
    this.metadata?.price &&
    this.metadata?.dealPrice
  ) {
    this.metadata.discountPercent = Math.round(
      ((this.metadata.price - this.metadata.dealPrice) / this.metadata.price) * 100
    );
  }

  // Mark first media as cover
  if (this.media && this.media.length) {
    this.media.forEach((m, idx) => {
      m.isCover = idx === 0;
    });
  }
});

/* ─── Instance method: is the listing currently visible? ─── */
listingSchema.methods.isLive = function () {
  return (
    ["PUBLISHED", "ACTIVE"].includes(this.status) &&
    this.visibility === "PUBLIC" &&
    (!this.expiresAt || this.expiresAt > new Date())
  );
};

const Listing = models.Listing || model("Listing", listingSchema);

export default Listing;
