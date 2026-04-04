// models/Deal.js
import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

/* ─── Image sub-document ─── */
const imageSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {          // e.g. Cloudinary public_id for deletion
      type: String,
      trim: true,
      default: null,
    },
    isCover: {           // first image marked as cover automatically
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

/* ─── Deal schema ─── */
const dealSchema = new Schema(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'shopId is required'],
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title must be under 120 characters'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description must be under 1000 characters'],
      default: '',
    },

    images: {
      type: [imageSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: 'You can upload a maximum of 10 images per deal',
      },
    },

    price: {
      type: Number,
      required: [true, 'Original price is required'],
      min: [0, 'Price cannot be negative'],
    },

    dealPrice: {
      type: Number,
      required: [true, 'Deal price is required'],
      min: [0, 'Deal price cannot be negative'],
      validate: {
        validator(v) {
          return v < this.price;
        },
        message: 'Deal price must be less than the original price',
      },
    },

    /* Computed convenience field (stored for fast sorting / filtering) */
    discountPercent: {
      type: Number,
      default: 0,
    },

    validFrom: {
      type: Date,
      required: [true, 'Start date is required'],
    },

    validTill: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator(v) {
          return v > this.validFrom;
        },
        message: 'validTill must be after validFrom',
      },
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /* Soft-delete */
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,       // adds createdAt, updatedAt
    versionKey: false,
  }
);

/* ─── Pre-save hook: compute discountPercent & mark cover image ─── */
dealSchema.pre('save', function () {
  if (this.price && this.dealPrice) {
    this.discountPercent = Math.round(((this.price - this.dealPrice) / this.price) * 100);
  }

  if (this.images && this.images.length) {
    this.images.forEach((img, idx) => {
      img.isCover = idx === 0;
    });
  }
});

/* ─── Indexes ─── */
dealSchema.index({ shopId: 1, isActive: 1 });
dealSchema.index({ validFrom: 1, validTill: 1 });
dealSchema.index({ createdAt: -1 });

/* ─── Instance method: check if currently valid ─── */
dealSchema.methods.isCurrentlyValid = function () {
  const now = new Date();
  return this.isActive && now >= this.validFrom && now <= this.validTill;
};

/* ─── Static: find active deals for a shop ─── */
dealSchema.statics.findActiveByShop = function (shopId) {
  const now = new Date();
  return this.find({
    shopId,
    isActive: true,
    isDeleted: false,
    validFrom: { $lte: now },
    validTill: { $gte: now },
  }).sort({ createdAt: -1 });
};

const Deal = models.Deal || model('Deal', dealSchema);

export default Deal;

