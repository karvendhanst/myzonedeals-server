import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./src/config/db.js";
import authRouter from "./src/routes/auth.routes.js";
import shopRouter from "./src/routes/shop.routes.js";
import dealRouter from "./src/routes/deal.route.js";

dotenv.config();

const app = express();

app.use(express.json());

connectDB();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.get("/api/health", (_, res) => {
  res.json({ msg: "app is running well !!!" });
});

app.use("/api/auth", authRouter);
app.use("/api/shop", shopRouter);
app.use("/api/deals", dealRouter);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server Running on Port ${port}`);
});