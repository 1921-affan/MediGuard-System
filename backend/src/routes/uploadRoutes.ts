import express from 'express';
import * as uploadController from '../controllers/uploadController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Upload Vitals

router.post(
    '/vitals',
    authenticate,
    authorize(['Patient']),
    upload.single('file'),
    uploadController.uploadVitals
);

// Get History
router.get('/history', authenticate, authorize(['Patient']), uploadController.getVitalsHistory);
router.get('/history/:patientId', authenticate, authorize(['Doctor']), uploadController.getPatientVitals);

export default router;
