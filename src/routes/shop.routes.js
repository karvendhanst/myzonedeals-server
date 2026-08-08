import express from "express";
import multer from "multer";
import upload from "../middleware/upload.js";
import { createShop, getMyShops, updateShop } from "../controllers/shop.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const shopRouter = express.Router();

// Memory-storage multer for updateShop (enables Cloudinary buffer upload + old image deletion)
const shopUpdateUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});

shopRouter.post("/create", protect, upload.single("shopImage"), createShop);
shopRouter.get("/my-shops", protect, getMyShops);
shopRouter.patch("/update/:shopId", protect, shopUpdateUpload.single("shopImage"), updateShop);

export default shopRouter;