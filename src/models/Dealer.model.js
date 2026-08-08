import mongoose from "mongoose";

const dealerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    phone: { type: String, unique: true, sparse: true },

    password: { type: String },

    role: { type: String, default: "shop_owner" },

    isVerified: { type: Boolean, default: false },

    otp: { type: String },
    otpExpiry: { type: Date },

    googleId: { type: String },
    authProvider: { type: String, default: "local", enum: ["local", "google"] },

    profilePicture: { type: String, default: null },
    profilePicturePublicId: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Dealer", dealerSchema);
