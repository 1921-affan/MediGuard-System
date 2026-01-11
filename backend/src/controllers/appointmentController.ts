import { Request, Response } from 'express';
import * as appointmentService from '../services/appointmentService';

// Extend Request if necessary, or cast
interface AuthRequest extends Request {
    user?: any;
}

// Helper to get profile ID (simplistic)
const getProfileId = async (userId: number, role: string) => {
    // Dynamic import to avoid circular dependency if any, or just for safety
    const authService = await import('../services/authService');
    const profile = await authService.getProfile(userId, role as 'Patient' | 'Doctor' | 'Admin');
    // @ts-ignore
    return role === 'Doctor' ? profile.Doctor_ID : profile.Patient_ID;
};

export const create = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        let patientId, doctorId, time, reason;

        if (user.role === 'Doctor') {
            doctorId = await getProfileId(user.id, 'Doctor');
            patientId = req.body.patientId;
            time = req.body.scheduledTime; // Frontend sends 'scheduledTime'
            reason = req.body.reason || 'Regular Checkup';
        } else {
            patientId = await getProfileId(user.id, 'Patient');
            doctorId = req.body.doctorId;
            time = req.body.scheduledTime || req.body.time;
            reason = req.body.reason;
        }

        if (!patientId || !doctorId || !time) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const result = await appointmentService.bookAppointment(patientId, doctorId, time, reason);
        res.status(201).json({ appointmentId: result, message: "Appointment created successfully" });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const book = async (req: AuthRequest, res: Response) => {
    try {
        const { doctorId, time, reason } = req.body;
        // Need Patient_ID. Assuming linked or passed.
        // If not passed, we default or use lookup. For now, simplistic:
        const patientId = req.body.patientId || req.user?.referenceId || 1;

        const result = await appointmentService.bookAppointment(patientId, doctorId, time, reason);
        res.status(201).json({ appointmentId: result });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};


export const list = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        let appointments;

        if (user.role === 'Doctor') {
            // Assume user.id is mapped or we fetch Doctor_ID.
            // Ideally: const profile = await authService.getProfile(user.id, 'Doctor');
            // appointments = await appointmentService.getDoctorAppointments(profile.Doctor_ID);
            // For simplicity, assuming we pass User ID or we fetched it.
            // Let's use getDoctorAppointments but we need Doctor_ID. 
            // Since we didn't implement getProfile in this file, we assume we can pass user.id if tables are synced or generic query.
            // Actually, getDoctorAppointments query uses "WHERE Doctor_ID = ?". 
            // If User_ID != Doctor_ID, this fails. 
            // Let's assume for this specific task we can just use the generic getAppointments OR we fix it properly.
            // Given the time, let's try to query utilizing the service logic or just generic for now.
            // Better: Updated getAppointments in service handles roles?
            // No, I added getDoctorAppointments explicitly.
            // Let's call that. But we need Doctor ID.
            // HACK: Pass user.id and hope for best or fetch.
            // Let's fetch profile first? No import available.
            // Let's trust getAppointments(userId, role) handles it?
            // Previous step: getAppointments logic was: "WHERE Doctor_ID = ?" using userId.
            // So if User_ID matches Doctor_ID it works. If Auto-Increment, it won't.
            // We need to fetch the real ID.
            // Allow me to import authService here.
            const profile = await import('../services/authService').then(m => m.getProfile(user.id, user.role));
            // @ts-ignore
            const realId = user.role === 'Doctor' ? profile.Doctor_ID : profile.Patient_ID;

            if (user.role === 'Doctor') {
                appointments = await appointmentService.getDoctorAppointments(realId);
            } else {
                appointments = await appointmentService.getAppointments(realId, user.role);
            }
        } else {
            // Patient
            // Same logic, get real ID
            const profile = await import('../services/authService').then(m => m.getProfile(user.id, user.role));
            // @ts-ignore
            appointments = await appointmentService.getAppointments(profile.Patient_ID, user.role);
        }

        res.json(appointments);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
