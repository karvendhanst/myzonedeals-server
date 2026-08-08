import Dealer from "../models/Dealer.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

/* ─── helpers ─── */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/* ══════════════════════════════════════════
   GET /api/dealer/profile
   Returns authenticated dealer's full profile
══════════════════════════════════════════ */
export const getProfile = asyncHandler(async (req, res) => {
  const dealer = await Dealer.findById(req.user._id).select(
    "-password -otp -otpExpiry"
  );
  if (!dealer) {
    return res.status(404).json({ success: false, message: "Dealer not found" });
  }
  res.status(200).json({ success: true, data: dealer });
});

/* ══════════════════════════════════════════
   PATCH /api/dealer/profile
   Updates name and phone only (email is read-only)
══════════════════════════════════════════ */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  // Explicitly reject email changes
  if (req.body.email) {
    return res.status(400).json({
      success: false,
      message: "Email cannot be changed.",
    });
  }

  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (phone !== undefined) updates.phone = phone.trim();

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid fields to update.",
    });
  }

  // Check for duplicate phone if updating phone
  if (updates.phone) {
    const existing = await Dealer.findOne({
      phone: updates.phone,
      _id: { $ne: req.user._id },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This phone number is already in use.",
      });
    }
  }

  const dealer = await Dealer.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).select("-password -otp -otpExpiry");

  if (!dealer) {
    return res.status(404).json({ success: false, message: "Dealer not found" });
  }

  res.status(200).json({ success: true, data: dealer });
});

/* ══════════════════════════════════════════
   POST /api/dealer/profile/picture
   Uploads/replaces dealer avatar on Cloudinary
══════════════════════════════════════════ */
export const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No image file provided.",
    });
  }

  const dealer = await Dealer.findById(req.user._id);
  if (!dealer) {
    return res.status(404).json({ success: false, message: "Dealer not found" });
  }

  // Delete old profile picture from Cloudinary if it exists
  if (dealer.profilePicturePublicId) {
    await deleteFromCloudinary(dealer.profilePicturePublicId).catch(() => {});
  }

  // Upload new image with face-crop transform
  const result = await uploadToCloudinary(req.file.buffer, {
    folder: "dealer_profiles",
    resource_type: "image",
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
  });

  dealer.profilePicture = result.secure_url;
  dealer.profilePicturePublicId = result.public_id;
  await dealer.save();

  res.status(200).json({
    success: true,
    data: {
      profilePicture: dealer.profilePicture,
      profilePicturePublicId: dealer.profilePicturePublicId,
    },
  });
});
