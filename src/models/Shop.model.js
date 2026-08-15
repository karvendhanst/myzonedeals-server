import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
    },

    shopImage: {
      type: String,
    },

    shopImagePublicId: {
      type: String,
      default: null,
    },

    dealerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Dealer ID is required"],
    },

    /**
     * category is now a free-text string (or optionally a ref to Category).
     * The old hardcoded enum has been removed so existing Shop documents with
     * enum values continue to read and write without validation errors.
     *
     * Recommended: use a Category slug (e.g. "grocery", "electronics").
     */
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },

    address: {
      street: {
        type: String,
        required: [true, "Street address is required"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      state: {
        type: String,
        required: [true, "State is required"],
        trim: true,
      },
      pincode: {
        type: String,
        required: [true, "Pincode is required"],
        match: [/^\d{6}$/, "Please enter a valid 6-digit pincode"],
      },
      country: {
        type: String,
        default: "India",
        trim: true,
      },
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: [true, "Coordinates are required"],
        validate: {
          validator: function (coords) {
            return (
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 &&
              coords[1] >= -90 &&
              coords[1] <= 90
            );
          },
          message: "Invalid coordinates. Provide [longitude, latitude].",
        },
      },
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    /**
     * status lifecycle:
     *  pending   → newly created, awaiting admin review
     *  active    → verified and live
     *  suspended → temporarily disabled by admin
     */
    status: {
      type: String,
      enum: ["pending", "active", "suspended"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

shopSchema.index({ location: "2dsphere" });
shopSchema.index({ dealerId: 1 });
shopSchema.index({ category: 1 });
shopSchema.index({ isVerified: 1, status: 1 });

const Shop = mongoose.model("Shop", shopSchema);

export default Shop;