/**
 * Category Seed Script
 *
 * Run once to populate the Category collection:
 *   node src/seed/categories.seed.js
 *
 * Safe to re-run — uses upsert on slug so it won't duplicate.
 */

import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Category from "../models/Category.model.js";

const categories = [
  // ────────────────────────────────────────────────────────────────────────────
  // SELL parent categories
  // ────────────────────────────────────────────────────────────────────────────
  {
    name: "Electronics",
    slug: "electronics",
    listingTypes: ["SELL", "DEAL"],
    icon: "📱",
    sortOrder: 1,
  },
  {
    name: "Vehicles",
    slug: "vehicles",
    listingTypes: ["SELL", "RENT"],
    icon: "🚗",
    sortOrder: 2,
  },
  {
    name: "Furniture",
    slug: "furniture",
    listingTypes: ["SELL", "RENT", "GIVEAWAY"],
    icon: "🛋️",
    sortOrder: 3,
  },
  {
    name: "Property",
    slug: "property",
    listingTypes: ["SELL", "RENT"],
    icon: "🏠",
    sortOrder: 4,
  },
  {
    name: "Clothing & Fashion",
    slug: "clothing-fashion",
    listingTypes: ["SELL", "GIVEAWAY", "DEAL"],
    icon: "👗",
    sortOrder: 5,
  },
  {
    name: "Books & Stationery",
    slug: "books-stationery",
    listingTypes: ["SELL", "GIVEAWAY", "DEAL"],
    icon: "📚",
    sortOrder: 6,
  },
  {
    name: "Sports & Fitness",
    slug: "sports-fitness",
    listingTypes: ["SELL", "RENT", "EVENT", "DEAL"],
    icon: "⚽",
    sortOrder: 7,
  },
  {
    name: "Home & Garden",
    slug: "home-garden",
    listingTypes: ["SELL", "RENT", "GIVEAWAY", "DEAL", "SERVICE"],
    icon: "🌿",
    sortOrder: 8,
  },

  // ────────────────────────────────────────────────────────────────────────────
  // EVENT categories
  // ────────────────────────────────────────────────────────────────────────────
  {
    name: "Events",
    slug: "events",
    listingTypes: ["EVENT"],
    icon: "🎉",
    sortOrder: 9,
  },

  // ────────────────────────────────────────────────────────────────────────────
  // SERVICE categories
  // ────────────────────────────────────────────────────────────────────────────
  {
    name: "Services",
    slug: "services",
    listingTypes: ["SERVICE"],
    icon: "🛠️",
    sortOrder: 10,
  },

  // ────────────────────────────────────────────────────────────────────────────
  // DEAL (Shop deal) categories — matching old Shop enum values exactly
  // ────────────────────────────────────────────────────────────────────────────
  {
    name: "Grocery",
    slug: "grocery",
    listingTypes: ["DEAL"],
    icon: "🛒",
    sortOrder: 11,
  },
  {
    name: "Restaurant",
    slug: "restaurant",
    listingTypes: ["DEAL"],
    icon: "🍽️",
    sortOrder: 12,
  },
  {
    name: "Pharmacy",
    slug: "pharmacy",
    listingTypes: ["DEAL"],
    icon: "💊",
    sortOrder: 13,
  },
  {
    name: "Bakery",
    slug: "bakery",
    listingTypes: ["DEAL"],
    icon: "🥐",
    sortOrder: 14,
  },
  {
    name: "Salon & Spa",
    slug: "salon-spa",
    listingTypes: ["DEAL", "SERVICE"],
    icon: "💇",
    sortOrder: 15,
  },
  {
    name: "Fitness",
    slug: "fitness",
    listingTypes: ["DEAL", "SERVICE"],
    icon: "💪",
    sortOrder: 16,
  },
  {
    name: "Jewellery",
    slug: "jewellery",
    listingTypes: ["DEAL", "SELL"],
    icon: "💍",
    sortOrder: 17,
  },
  {
    name: "Hardware",
    slug: "hardware",
    listingTypes: ["DEAL", "SELL"],
    icon: "🔧",
    sortOrder: 18,
  },
  {
    name: "Other",
    slug: "other",
    listingTypes: ["ALL"],
    icon: "📦",
    sortOrder: 99,
  },
];

// Sub-categories
const subCategories = [
  // Electronics children
  { name: "Mobile Phones", slug: "mobile-phones", parentSlug: "electronics", listingTypes: ["SELL", "DEAL"] },
  { name: "Laptops & Computers", slug: "laptops-computers", parentSlug: "electronics", listingTypes: ["SELL", "DEAL"] },
  { name: "Accessories", slug: "accessories", parentSlug: "electronics", listingTypes: ["SELL", "DEAL"] },
  { name: "Cameras", slug: "cameras", parentSlug: "electronics", listingTypes: ["SELL", "RENT"] },
  // Vehicles children
  { name: "Cars", slug: "cars", parentSlug: "vehicles", listingTypes: ["SELL", "RENT"] },
  { name: "Motorcycles", slug: "motorcycles", parentSlug: "vehicles", listingTypes: ["SELL", "RENT"] },
  { name: "Bicycles", slug: "bicycles", parentSlug: "vehicles", listingTypes: ["SELL", "RENT"] },
  { name: "Commercial Vehicles", slug: "commercial-vehicles", parentSlug: "vehicles", listingTypes: ["SELL", "RENT"] },
  // Property children
  { name: "Apartment", slug: "apartment", parentSlug: "property", listingTypes: ["SELL", "RENT"] },
  { name: "House / Villa", slug: "house-villa", parentSlug: "property", listingTypes: ["SELL", "RENT"] },
  { name: "Land / Plot", slug: "land-plot", parentSlug: "property", listingTypes: ["SELL"] },
  { name: "Commercial Space", slug: "commercial-space", parentSlug: "property", listingTypes: ["SELL", "RENT"] },
  { name: "PG / Hostel", slug: "pg-hostel", parentSlug: "property", listingTypes: ["RENT"] },
  // Events children
  { name: "Music & Concert", slug: "music-concert", parentSlug: "events", listingTypes: ["EVENT"] },
  { name: "Sports", slug: "sports", parentSlug: "events", listingTypes: ["EVENT"] },
  { name: "Workshop & Training", slug: "workshop-training", parentSlug: "events", listingTypes: ["EVENT"] },
  { name: "Business & Networking", slug: "business-networking", parentSlug: "events", listingTypes: ["EVENT"] },
  { name: "Community", slug: "community", parentSlug: "events", listingTypes: ["EVENT"] },
  // Services children
  { name: "Home Services", slug: "home-services", parentSlug: "services", listingTypes: ["SERVICE"] },
  { name: "Tutoring & Education", slug: "tutoring-education", parentSlug: "services", listingTypes: ["SERVICE"] },
  { name: "Repair & Maintenance", slug: "repair-maintenance", parentSlug: "services", listingTypes: ["SERVICE"] },
  { name: "Freelance & Consulting", slug: "freelance-consulting", parentSlug: "services", listingTypes: ["SERVICE"] },
  { name: "Beauty & Wellness", slug: "beauty-wellness", parentSlug: "services", listingTypes: ["SERVICE"] },
];

async function seed() {
  await connectDB();

  console.log("🌱 Seeding categories...");

  // Upsert top-level categories
  const slugToId = {};
  for (const cat of categories) {
    const doc = await Category.findOneAndUpdate(
      { slug: cat.slug },
      { ...cat, parentCategory: null },
      { upsert: true, new: true, runValidators: true }
    );
    slugToId[cat.slug] = doc._id;
    console.log(`  ✓ ${cat.name}`);
  }

  // Upsert sub-categories
  for (const sub of subCategories) {
    const parentId = slugToId[sub.parentSlug];
    if (!parentId) {
      console.warn(`  ⚠ Parent not found for ${sub.slug}, skipping`);
      continue;
    }
    await Category.findOneAndUpdate(
      { slug: sub.slug },
      {
        name: sub.name,
        slug: sub.slug,
        parentCategory: parentId,
        listingTypes: sub.listingTypes,
        sortOrder: sub.sortOrder ?? 0,
        status: "active",
      },
      { upsert: true, new: true, runValidators: true }
    );
    console.log(`    ↳ ${sub.name}`);
  }

  console.log("\n✅ Category seed complete");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
