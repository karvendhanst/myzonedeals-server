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
    dealType = 'discount',
    price,
    dealPrice,
    validFrom,
    validTill,
    isActive,
  } = req.body;

  if (!shopId) return sendError(res, 'shopId is required');

  // Parse nested objects that arrive as JSON strings via multipart FormData
  let bogoDetails;
  let freebieDetails;
  try {
    if (req.body.bogoDetails) bogoDetails = JSON.parse(req.body.bogoDetails);
    if (req.body.freebieDetails) freebieDetails = JSON.parse(req.body.freebieDetails);
  } catch {
    return sendError(res, 'Invalid bogoDetails or freebieDetails JSON');
  }

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

  /* ── build document fields ── */
  const docFields = {
    shopId,
    title,
    description,
    dealType,
    price: Number(price),
    validFrom: new Date(validFrom),
    validTill: new Date(validTill),
    isActive: isActive === 'false' ? false : Boolean(isActive ?? true),
    images,
  };

  if (dealType === 'discount') {
    docFields.dealPrice = Number(dealPrice);
  } else if (dealType === 'bogo' && bogoDetails) {
    docFields.bogoDetails = bogoDetails;
  } else if (dealType === 'freebie' && freebieDetails) {
    docFields.freebieDetails = freebieDetails;
  }

  const deal = await Deal.create(docFields);

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
  const allowed = [
    'title', 'description', 'dealType',
    'price', 'dealPrice',
    'bogoDetails', 'freebieDetails',
    'validFrom', 'validTill', 'isActive',
  ];
  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });

  const deal = await Deal.findOne({ _id: req.params.id, isDeleted: false });
  if (!deal) return sendError(res, 'Deal not found', 404);

  Object.keys(updates).forEach((key) => {
    deal[key] = updates[key];
  });

  await deal.save();

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
        isActive: true,
        validTill: { $gte: new Date() }, // exclude expired deals
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

    // Skip shops that have no location data or empty coordinates array —
    // they would produce null/NaN lat-lng and vanish silently on the map.
    {
      $match: {
        "shop.location.coordinates": { $exists: true, $not: { $size: 0 } },
      },
    },

    /* ───── final response ───── */
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        images: 1,
        dealType: 1,
        price: 1,
        dealPrice: 1,
        bogoDetails: 1,
        freebieDetails: 1,
        discountPercent: 1,
        validFrom: 1,
        validTill: 1,
        isActive: 1,
        createdAt: 1,

        /* shop details — shopId as a plain string so JS object-key
           grouping on the frontend works correctly (ObjectId objects
           all stringify to "[object Object]" when used as keys). */
        shopId: { $toString: "$shop._id" },
        shopName: "$shop.name",
        shopImage: "$shop.shopImage",
        category: "$shop.category",
        address: "$shop.address",

        /* coordinates — [lng, lat] in GeoJSON order */
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