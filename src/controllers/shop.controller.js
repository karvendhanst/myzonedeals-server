import Shop from "../models/Shop.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

export const getMyShops = async (req, res) => {
  try {
    const shops = await Shop.find({ dealerId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: shops });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createShop = async (req, res) => {
  try {
    const {
      name,
      category,
      street,
      city,
      state,
      pincode,
      country,
      longitude,
      latitude,
    } = req.body;

    const imageUrl = req.file ? req.file.path : null;

    const shop = await Shop.create({
      name,
      dealerId: req.user._id,
      category,
      address: { street, city, state, pincode, country },
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      shopImage: imageUrl,
    });

    res.status(201).json({
      success: true,
      data: shop,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ══════════════════════════════════════════
   PATCH /api/shop/update/:shopId
   Dealer can update their own shop details
══════════════════════════════════════════ */
export const updateShop = async (req, res) => {
  try {
    const { shopId } = req.params;

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    // Ownership check — only the dealer who owns the shop can update it
    if (shop.dealerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied: you do not own this shop",
      });
    }

    const { name, category, street, city, state, pincode, country, longitude, latitude } = req.body;

    if (name !== undefined) shop.name = name.trim();
    if (category !== undefined) shop.category = category;

    // Partial address update — only update provided subfields
    if (street !== undefined) shop.address.street = street.trim();
    if (city !== undefined) shop.address.city = city.trim();
    if (state !== undefined) shop.address.state = state.trim();
    if (pincode !== undefined) shop.address.pincode = pincode.trim();
    if (country !== undefined) shop.address.country = country.trim();

    if (longitude !== undefined && latitude !== undefined) {
      shop.location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }

    // Handle new shop image
    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (shop.shopImagePublicId) {
        await deleteFromCloudinary(shop.shopImagePublicId).catch(() => {});
      }

      const result = await uploadToCloudinary(req.file.buffer, {
        folder: "shops",
        resource_type: "image",
      });

      shop.shopImage = result.secure_url;
      shop.shopImagePublicId = result.public_id;
    }

    await shop.save();

    res.status(200).json({ success: true, data: shop });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};