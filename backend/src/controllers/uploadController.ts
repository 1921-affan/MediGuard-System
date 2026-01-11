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
        try {
            // @ts-ignore
            aiResult = await aiService.analyzeHealth(patientId, 'Upload');
        } catch (aiError) {
            console.error('AI Analysis failed, but upload succeeded:', aiError);
            // We swallow the error so the user still gets their upload confirmation
        }

        res.json({ ...result, aiAnalysis: aiResult });
    } catch (error: any) {
        console.error('Upload Error:', error);
        res.status(500).json({
            message: error.message,
            // @ts-ignore
            errorDetails: error.response ? error.response.data : error
        });
    }
};
