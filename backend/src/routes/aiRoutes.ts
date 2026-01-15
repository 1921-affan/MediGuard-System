import express from 'express';
import * as aiController from '../controllers/aiController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Trigger Analysis (Doctor or Patient?)
// Spec: "Patient View AI health insights... Doctor View... AI-initiated."
// Manual trigger useful for testing or "Run Check".
router.post('/analyze', authenticate, authorize(['Doctor', 'Patient']), aiController.analyzeHealth);

// Get History
router.get('/:patientId', authenticate, authorize(['Doctor', 'Patient']), aiController.getInsights);

// Chat with AI
router.post('/chat', authenticate, authorize(['Patient', 'Doctor']), aiController.chat);

export default router;
