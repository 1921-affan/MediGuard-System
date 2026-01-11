import express from 'express';
import * as appointmentController from '../controllers/appointmentController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', authenticate, authorize(['Doctor', 'Patient']), appointmentController.create);
router.post('/book', authenticate, authorize(['Patient']), appointmentController.book);
router.get('/', authenticate, appointmentController.list);

export default router;
