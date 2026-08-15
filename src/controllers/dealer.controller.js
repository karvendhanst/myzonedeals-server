import User from "../models/User.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

/* ─── helpers ─── */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/* ══════════════════════════════════════════
   GET /api/dealer/profile
   Returns authenticated user's full profile
══════════════════════════════════════════ */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -otp -otpExpiry"
  );
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  res.status(200).json({ success: true, data: user });
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
    const existing = await User.findOne({
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

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).select("-password -otp -otpExpiry");

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({ success: true, data: user });
});

/* ══════════════════════════════════════════
   POST /api/dealer/profile/picture
   Uploads/replaces user avatar on Cloudinary
══════════════════════════════════════════ */
export const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No image file provided.",
    });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Delete old profile picture from Cloudinary if it exists
  if (user.profilePicturePublicId) {
    await deleteFromCloudinary(user.profilePicturePublicId).catch(() => {});
  }

  // Upload new image with face-crop transform
  const result = await uploadToCloudinary(req.file.buffer, {
    folder: "dealer_profiles",
    resource_type: "image",
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
  });

  user.profilePicture = result.secure_url;
  user.profilePicturePublicId = result.public_id;
  await user.save();

  res.status(200).json({
    success: true,
    data: {
      profilePicture: user.profilePicture,
      profilePicturePublicId: user.profilePicturePublicId,
    },
  });
});
