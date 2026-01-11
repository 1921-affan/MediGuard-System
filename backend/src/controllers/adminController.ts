
import { Request, Response } from 'express';
import * as adminService from '../services/adminService';

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await adminService.getAllUsers();
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getStats = async (req: Request, res: Response) => {
    try {
        const stats = await adminService.getUserStats();
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateUserStatus = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id);
        const { isActive } = req.body;
        await adminService.toggleUserStatus(userId, isActive);
        res.json({ message: 'User status updated successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
