import { Request, Response } from 'express';
import * as clinicalService from '../services/clinicalService';

export const addRecord = async (req: Request, res: Response) => {
    try {
        const result = await clinicalService.createRecord(req.body);
        res.status(201).json({ recordId: result });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getHistory = async (req: Request, res: Response) => {
    try {
        // Validation: Ensure Doctor accesses or Patient accesses own
        const patientId = parseInt(req.params.patientId);
        const history = await clinicalService.getHistory(patientId);
        res.json(history);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}


export const getMyPatients = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const user = req.user;
        // Need Doctor_ID.
        const profile = await import('../services/authService').then(m => m.getProfile(user.id, user.role));
        // @ts-ignore
        const patients = await clinicalService.getPatientsByDoctor(profile.Doctor_ID);
        res.json(patients);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
