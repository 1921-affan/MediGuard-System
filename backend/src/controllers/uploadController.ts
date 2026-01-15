import { Request, Response } from 'express';
import * as uploadService from '../services/uploadService';
import path from 'path';

interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

// Request should contain user info from Auth Middleware
interface AuthRequest extends MulterRequest {
    user?: any;
}

import * as aiService from '../services/aiService';
import * as authService from '../services/authService';

export const uploadVitals = async (req: AuthRequest, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        // Fetch Patient ID using User ID from token
        const userId = req.user?.id;
        if (!userId) throw new Error('User not authenticated');

        const profile: any = await authService.getProfile(userId, 'Patient');
        if (!profile || !profile.Patient_ID) {
            throw new Error('Patient profile not found');
        }
        const patientId = profile.Patient_ID;

        const result = await uploadService.processUpload(
            req.file.path,
            req.file.originalname,
            patientId,
            req.file.size
        );

        // Trigger AI Analysis (Safe Mode)
        let aiResult = null;
        let recentVitals = [];
        try {
            // @ts-ignore
            aiResult = await aiService.analyzeHealth(patientId, 'Upload');

            // Also fetch the vitals data for the chart (duplicate of what AI did, but needed for UI)
            // Ideally AI Service returns it, but this is fine for now
            const VitalsLog = require('../models/nosql/VitalsLog').default;
            recentVitals = await VitalsLog.find({ Patient_ID: patientId }).sort({ Timestamp: -1 }).limit(20);

        } catch (aiError) {
            console.error('AI Analysis failed, but upload succeeded:', aiError);
            // We swallow the error so the user still gets their upload confirmation
        }

        res.json({ ...result, aiAnalysis: aiResult, recentVitals });
    } catch (error: any) {
        console.error('Upload Error:', error);
        res.status(500).json({
            message: error.message,
            // @ts-ignore
            errorDetails: error.response ? error.response.data : error
        });
    }
};

export const getVitalsHistory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const profile: any = await authService.getProfile(userId, 'Patient');
        if (!profile) throw new Error('Patient not found');

        const VitalsLog = require('../models/nosql/VitalsLog').default;
        const vitals = await VitalsLog.find({ Patient_ID: profile.Patient_ID })
            .sort({ Timestamp: -1 })
            .limit(20);

        res.json(vitals);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
