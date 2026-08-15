import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

/**
 * Category model — powers API-driven category selectors throughout
 * the listing forms and map filters.
 *
 * A category can be:
 *  - Top-level: parentCategory = null
 *  - Sub-category: parentCategory = ObjectId of parent
 *
 * listingTypes controls which listing types this category is valid for.
 * An empty array means "all types".
 */
const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },

    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    /**
     * Which listing types can use this category.
     * Leave empty array to allow all types.
     */
    listingTypes: {
      type: [String],
      enum: ["SELL", "RENT", "EVENT", "SERVICE", "GIVEAWAY", "DEAL", "ALL"],
      default: ["ALL"],
    },

    icon: {
      type: String, // emoji or icon name (e.g. "🛍️" or "ShoppingBag")
      default: null,
    },

    image: {
      type: String, // URL
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* ─── Indexes ─── */
categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ listingTypes: 1 });
categorySchema.index({ status: 1, sortOrder: 1 });

const Category = models.Category || model("Category", categorySchema);

export default Category;
