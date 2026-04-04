import Shop from "../models/Shop.model.js";

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
      dealerId: req.user._id, // or pass manually
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