import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const listingReportSchema = new Schema(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: [true, "listingId is required"],
      index: true,
    },

    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "reportedBy is required"],
    },

    reason: {
      type: String,
      enum: [
        "spam",
        "fraud",
        "incorrect_info",
        "prohibited_content",
        "duplicate",
        "wrong_location",
        "other",
      ],
      required: [true, "Report reason is required"],
    },

    details: {
      type: String,
      trim: true,
      maxlength: [500, "Details must be under 500 characters"],
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed"],
      default: "pending",
    },

    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewNote: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* One report per user per listing */
listingReportSchema.index(
  { listingId: 1, reportedBy: 1 },
  { unique: true }
);
listingReportSchema.index({ status: 1, createdAt: -1 });

const ListingReport =
  models.ListingReport || model("ListingReport", listingReportSchema);

export default ListingReport;
