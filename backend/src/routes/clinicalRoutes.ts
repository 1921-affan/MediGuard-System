import express from 'express';
import * as clinicalController from '../controllers/clinicalController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// @ts-ignore
router.get('/my-patients', authenticate, authorize(['Doctor']), clinicalController.getMyPatients);
router.post('/', authenticate, authorize(['Doctor']), clinicalController.addRecord);
router.get('/:patientId', authenticate, authorize(['Doctor', 'Patient']), clinicalController.getHistory);

export default router;
