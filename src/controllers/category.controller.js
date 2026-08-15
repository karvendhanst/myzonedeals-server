import Category from "../models/Category.model.js";

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const sendSuccess = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, ...data });

const sendError = (res, message, statusCode = 400) =>
  res.status(statusCode).json({ success: false, message });

/* ══════════════════════════════════════════════════════
   GET /api/categories
   Public — returns active categories, optionally filtered
   by listingType and/or parentCategory
══════════════════════════════════════════════════════ */
export const getCategories = asyncHandler(async (req, res) => {
  const { listingType, parentId, flat } = req.query;

  const filter = { status: "active" };

  if (listingType) {
    filter.listingTypes = { $in: [listingType, "ALL"] };
  }

  if (parentId === "null" || parentId === "") {
    filter.parentCategory = null;
  } else if (parentId) {
    filter.parentCategory = parentId;
  }

  const categories = await Category.find(filter)
    .populate("parentCategory", "name slug")
    .sort({ sortOrder: 1, name: 1 });

  return sendSuccess(res, { categories, count: categories.length });
});

/* ══════════════════════════════════════════════════════
   GET /api/categories/tree
   Public — returns the full category tree (nested)
══════════════════════════════════════════════════════ */
export const getCategoryTree = asyncHandler(async (req, res) => {
  const { listingType } = req.query;

  const filter = { status: "active", parentCategory: null };
  if (listingType) {
    filter.listingTypes = { $in: [listingType, "ALL"] };
  }

  const topLevel = await Category.find(filter).sort({ sortOrder: 1, name: 1 });

  const tree = await Promise.all(
    topLevel.map(async (parent) => {
      const children = await Category.find({
        parentCategory: parent._id,
        status: "active",
      }).sort({ sortOrder: 1, name: 1 });

      return { ...parent.toObject(), children };
    })
  );

  return sendSuccess(res, { tree });
});

/* ══════════════════════════════════════════════════════
   GET /api/categories/:slug
   Public
══════════════════════════════════════════════════════ */
export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({
    slug: req.params.slug,
    status: "active",
  }).populate("parentCategory", "name slug");

  if (!category) return sendError(res, "Category not found", 404);

  return sendSuccess(res, { category });
});

/* ══════════════════════════════════════════════════════
   POST /api/categories
   Admin only
══════════════════════════════════════════════════════ */
export const createCategory = asyncHandler(async (req, res) => {
  const { name, slug, parentCategory, listingTypes, icon, image, sortOrder } =
    req.body;

  const category = await Category.create({
    name,
    slug,
    parentCategory: parentCategory || null,
    listingTypes: listingTypes || ["ALL"],
    icon,
    image,
    sortOrder: sortOrder ?? 0,
  });

  return sendSuccess(res, { category }, 201);
});

/* ══════════════════════════════════════════════════════
   PATCH /api/categories/:id
   Admin only
══════════════════════════════════════════════════════ */
export const updateCategory = asyncHandler(async (req, res) => {
  const allowed = [
    "name",
    "slug",
    "parentCategory",
    "listingTypes",
    "icon",
    "image",
    "status",
    "sortOrder",
  ];
  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });

  const category = await Category.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!category) return sendError(res, "Category not found", 404);

  return sendSuccess(res, { category });
});
