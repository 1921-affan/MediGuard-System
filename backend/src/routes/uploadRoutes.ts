import express from 'express';
import * as uploadController from '../controllers/uploadController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Temp storage

router.post(
    '/vitals',
    authenticate,
    authorize(['Patient']),
    upload.single('file'),
    uploadController.uploadVitals
);

export default router;
