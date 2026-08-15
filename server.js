import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./src/config/db.js";

// ── Existing routers (preserved, unchanged) ──
import authRouter from "./src/routes/auth.routes.js";
import shopRouter from "./src/routes/shop.routes.js";
import dealRouter from "./src/routes/deal.route.js";
import dealerRouter from "./src/routes/dealer.routes.js";

// ── New routers ──
import listingRouter from "./src/routes/listing.routes.js";
import categoryRouter from "./src/routes/category.routes.js";
import adminRouter from "./src/routes/admin.routes.js";

// ── Cron jobs ──
import { startExpiredDealsCron } from "./src/jobs/expiredDealsCron.js";
import { startExpiredListingsCron } from "./src/jobs/expiredListingsCron.js";


const app = express();

connectDB();

// Start cron jobs
startExpiredDealsCron();
startExpiredListingsCron();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://myzonedeals.vercel.app",
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_, res) => {
  res.json({ msg: "app is running well !!!" });
});

// ── Existing routes (all preserved — no breaking changes) ──
app.use("/api/auth", authRouter);
app.use("/api/shop", shopRouter);
app.use("/api/deals", dealRouter);
app.use("/api/dealer", dealerRouter);

// ── New routes ──
app.use("/api/listings", listingRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/admin", adminRouter);

// ── Global error handler ──
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.statusCode ?? 500).json({
    success: false,
    message: err.message ?? "Internal Server Error",
  });
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server Running on Port ${port}`);
});