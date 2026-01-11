import express from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
// @ts-ignore
router.get('/profile', authenticate, authController.getUserProfile);
// @ts-ignore
router.put('/profile', authenticate, authController.updateUserProfile);
// @ts-ignore
router.get('/doctors', authenticate, authController.listDoctors);
// @ts-ignore
router.get('/patients', authenticate, authController.listPatients);
// @ts-ignore
router.get('/search-patients', authenticate, authController.searchPatients);

export default router;
