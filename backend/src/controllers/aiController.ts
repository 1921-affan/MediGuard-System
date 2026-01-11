import { Request, Response } from 'express';
import * as aiService from '../services/aiService';
import AIInsight from '../models/nosql/AIInsight';

// AuthRequest helper
interface AuthRequest extends Request {
    user?: any;
}

export const analyzeHealth = async (req: AuthRequest, res: Response) => {
    try {
        const patientId = parseInt(req.body.patientId || req.user?.referenceId);
        // Validation...
        const result = await aiService.analyzeHealth(patientId, 'Doctor'); // Manual trigger usually by Doctor or Patient
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ message: 'Analysis Failed', error: error.message });
    }
};

export const getInsights = async (req: AuthRequest, res: Response) => {
    try {
        const patientId = parseInt(req.params.patientId);
        // Authorization check: User must be Patient(id) or Doctor
        const insights = await AIInsight.find({ Patient_ID: patientId }).sort({ Generated_At: -1 });
        res.json(insights);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
