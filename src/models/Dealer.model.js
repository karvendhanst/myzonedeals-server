import mongoose from "mongoose";

const dealerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    phone: { type: String, required: true, unique: true },

    password: { type: String, required: true },

    role: { type: String, default: "shop_owner" },

    isVerified: { type: Boolean, default: false },

    otp: { type: String },
    otpExpiry: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Dealer", dealerSchema);
