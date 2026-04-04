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
    dealerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
      required: [true, "Dealer ID is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Grocery",
        "Restaurant",
        "Pharmacy",
        "Electronics",
        "Clothing",
        "Bakery",
        "Salon & Spa",
        "Fitness",
        "Books & Stationery",
        "Jewellery",
        "Hardware",
        "Other",
      ],
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
    // isFeatured: {
    //   type: Boolean,
    //   default: false,
    // },
  },
  {
    timestamps: true,
  }
);

shopSchema.index({ location: "2dsphere" });
shopSchema.index({ dealerId: 1 });
shopSchema.index({ category: 1 });
shopSchema.index({ isVerified: 1, isFeatured: 1 });

const Shop = mongoose.model("Shop", shopSchema);

export default Shop;