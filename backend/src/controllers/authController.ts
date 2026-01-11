import { Request, Response } from 'express';
import * as authService from '../services/authService';

export const register = async (req: Request, res: Response) => {
    try {
        const result = await authService.registerUser(req.body);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await authService.loginUser(email, password);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getUserProfile = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const { id, role } = req.user;
        const profile = await authService.getProfile(id, role);
        res.json(profile);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateUserProfile = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const { id, role } = req.user;
        await authService.updateProfile(id, role, req.body);
        res.json({ message: 'Profile updated successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const listDoctors = async (req: Request, res: Response) => {
    try {
        const doctors = await authService.getAllDoctors();
        res.json(doctors);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}


export const listPatients = async (req: Request, res: Response) => {
    try {
        const patients = await authService.getAllPatients();
        res.json(patients);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}


export const searchPatients = async (req: Request, res: Response) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.json([]);
        }
        const patients = await authService.searchPatients(query as string);
        res.json(patients);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
