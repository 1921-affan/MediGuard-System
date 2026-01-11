
import express from 'express';
import * as adminController from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticate, authorize(['Admin']));

router.get('/users', adminController.getUsers);
router.get('/stats', adminController.getStats);
router.patch('/users/:id/status', adminController.updateUserStatus);

export default router;
