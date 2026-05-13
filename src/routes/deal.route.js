// routes/dealRoutes.js
import express from 'express';
import multer from 'multer';
import {
  createDeal,
  getDeals,
  getDealById,
  updateDeal,
  deleteDeal,
  getAllDealsWithLocation,
} from '../controllers/deals.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const dealRouter = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,  
    files: 10,                  
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
});

const handleMulterError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'Only image files are allowed') {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
};

/* ════════════════════════════════
   Routes
════════════════════════════════ */

dealRouter
  .route('/')
  .get(getDeals);

  dealRouter
  .route('/map')
  .get(getAllDealsWithLocation);

dealRouter
  .route('/create')
  .post(protect,  upload.array('images', 10), handleMulterError, createDeal);

dealRouter
  .route('/:id')
  .get(getDealById)
  .patch(protect, updateDeal)
  .delete(protect, deleteDeal);


export default dealRouter;

