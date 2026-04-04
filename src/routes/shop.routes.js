import express from "express";
import upload from "../middleware/upload.js";
import { createShop, getMyShops } from "../controllers/shop.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const shopRouter = express.Router();

shopRouter.post("/create", protect, upload.single("shopImage"), createShop);
shopRouter.get("/my-shops", protect, getMyShops);

export default shopRouter;