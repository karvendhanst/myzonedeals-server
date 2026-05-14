// controllers/dealController.js
import Deal from '../models/Deal.model.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js'; // adapt to your uploader

/* ─── helpers ─── */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const sendSuccess = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, ...data });

const sendError = (res, message, statusCode = 400) =>
  res.status(statusCode).json({ success: false, message });

/* ══════════════════════════════════════════
   POST /api/deals
   multipart/form-data — images via multer
══════════════════════════════════════════ */
export const createDeal = asyncHandler(async (req, res) => {
  const {
    shopId,
    title,
    description,
    price,
    dealPrice,
    validFrom,
    validTill,
    isActive,
  } = req.body;

  if (!shopId) return sendError(res, 'shopId is required');

  let images = [];
  if (req.files && req.files.length > 0) {
    if (req.files.length > 10)
      return sendError(res, 'You can upload a maximum of 10 images per deal');

    const uploads = await Promise.all(
      req.files.map((file) =>
        uploadToCloudinary(file.buffer, {
          folder: `deals/${shopId}`,
          resource_type: 'image',
        })
      )
    );

    images = uploads.map((result, idx) => ({
      url: result.secure_url,
      publicId: result.public_id,
      isCover: idx === 0,
    }));
  }

  /* ── create document ── */
  const deal = await Deal.create({
    shopId,
    title,
    description,
    price: Number(price),
    dealPrice: Number(dealPrice),
    validFrom: new Date(validFrom),
    validTill: new Date(validTill),
    isActive: isActive === 'false' ? false : Boolean(isActive ?? true),
    images,
  });

  return sendSuccess(res, { deal }, 201);
});

// GET /api/deals
export const getAllDeals = asyncHandler(async (req, res) => {
  const deals = await Deal.find({
    isDeleted: false,
  })
    .populate("shopId")
    .sort({ createdAt: -1 });

  return sendSuccess(res, {
    deals,
    count: deals.length,
  });
});


/* ══════════════════════════════════════════
   GET /api/deals?shopId=xxx
══════════════════════════════════════════ */
export const getDeals = asyncHandler(async (req, res) => {
  const { shopId, activeOnly } = req.query;

  const filter = { isDeleted: false };
  if (shopId) filter.shopId = shopId;
  if (activeOnly === 'true') {
    const now = new Date();
    filter.isActive = true;
    filter.validFrom = { $lte: now };
    filter.validTill = { $gte: now };
  }

  const deals = await Deal.find(filter).sort({ createdAt: -1 });
  return sendSuccess(res, { deals, count: deals.length });
});

/* ══════════════════════════════════════════
   GET /api/deals/:id
══════════════════════════════════════════ */
export const getDealById = asyncHandler(async (req, res) => {
  const deal = await Deal.findOne({ _id: req.params.id, isDeleted: false });
  if (!deal) return sendError(res, 'Deal not found', 404);
  return sendSuccess(res, { deal });
});

/* ══════════════════════════════════════════
   PATCH /api/deals/:id  
══════════════════════════════════════════ */
export const updateDeal = asyncHandler(async (req, res) => {
  const allowed = ['title', 'description', 'price', 'dealPrice', 'validFrom', 'validTill', 'isActive'];
  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });

  const deal = await Deal.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    updates,
    { new: true, runValidators: true }
  );

  if (!deal) return sendError(res, 'Deal not found', 404);
  return sendSuccess(res, { deal });
});

/* ══════════════════════════════════════════
   DELETE /api/deals/:id  
══════════════════════════════════════════ */
export const deleteDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { isDeleted: true, isActive: false },
    { new: true }
  );

  if (!deal) return sendError(res, 'Deal not found', 404);

  if (deal.images.length) {
    await Promise.allSettled(
      deal.images
        .filter((img) => img.publicId)
        .map((img) => deleteFromCloudinary(img.publicId))
    );
  }

  return sendSuccess(res, { message: 'Deal deleted successfully' });
});


export const getAllDealsWithLocation = asyncHandler(async (req, res) => {
  const deals = await Deal.aggregate([
    {
      $match: {
        isDeleted: false,
      },
    },

    {
      $lookup: {
        from: "shops", 
        localField: "shopId",
        foreignField: "_id",
        as: "shop",
      },
    },

    {
      $unwind: "$shop",
    },

    /* ───── final response ───── */
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        images: 1,
        price: 1,
        dealPrice: 1,
        discountPercent: 1,
        validFrom: 1,
        validTill: 1,
        isActive: 1,
        createdAt: 1,

        /* shop details */
        shopId: "$shop._id",
        shopName: "$shop.name",
        shopImage: "$shop.shopImage",
        category: "$shop.category",
        address: "$shop.address",

        /* coordinates */
        latitude: {
          $arrayElemAt: ["$shop.location.coordinates", 1],
        },
        longitude: {
          $arrayElemAt: ["$shop.location.coordinates", 0],
        },
      },
    },

    /* ───── latest deals first ───── */
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  return sendSuccess(res, {
    deals,
    count: deals.length,
  });
});