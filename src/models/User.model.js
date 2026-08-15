import mongoose from "mongoose";

/**
 * Unified User model — replaces the old Dealer model.
 *
 * IMPORTANT: We intentionally keep the collection name "dealers" so that
 * all existing documents are immediately available without any data migration.
 * A future migration script can rename the collection to "users" once the
 * team is ready.
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    phone: { type: String, unique: true, sparse: true },

    password: { type: String },

    /**
     * role controls what a user is allowed to do:
     *  - user   → any registered individual (can create SELL/RENT/EVENT/SERVICE/GIVEAWAY)
     *  - dealer → shop owner (can additionally create DEAL listings via verified Shop)
     *  - admin  → platform moderator (can approve/reject any listing)
     *
     * Existing documents that pre-date this field will read as undefined,
     * which the policy layer treats as 'user' (least privilege).
     */
    role: {
      type: String,
      enum: ["user", "dealer", "admin"],
      default: "user",
    },

    isVerified: { type: Boolean, default: false },

    otp: { type: String },
    otpExpiry: { type: Date },

    googleId: { type: String },
    authProvider: {
      type: String,
      default: "local",
      enum: ["local", "google"],
    },

    profilePicture: { type: String, default: null },
    profilePicturePublicId: { type: String, default: null },
  },
  {
    timestamps: true,
    // Keep the existing collection name — no data migration required.
    collection: "dealers",
  }
);

export default mongoose.model("User", userSchema);
