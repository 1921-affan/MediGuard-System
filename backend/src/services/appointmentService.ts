import { mysqlPool } from '../config/database';

export const bookAppointment = async (patientId: number, doctorId: number, time: string, reason: string) => {
    const connection = await mysqlPool.getConnection();
    try {
        // Check availability (simplistic check for overlap)
        console.log(`Checking conflict for Doctor: ${doctorId} at Time: ${time}`);
        const [existing] = await connection.query(
            'SELECT * FROM Appointment WHERE Doctor_ID = ? AND Scheduled_Time = ? AND Status = "Scheduled"',
            [doctorId, time]
        );
        console.log('Existing conflict result:', existing);
        // @ts-ignore
        if (existing.length > 0) {
            throw new Error('Doctor is already having an appointment at this time. Please try another time.');
        }

        // Validate Consulting Hours
        const [doctorRows] = await connection.query('SELECT Consult_Hrs FROM Doctor WHERE Doctor_ID = ?', [doctorId]);
        // @ts-ignore
        const doctor = doctorRows[0];
        if (doctor && doctor.Consult_Hrs) {
            // Format "09:30 - 18:30"
            const [startStr, endStr] = doctor.Consult_Hrs.split('-').map((s: string) => s.trim());

            const apptDate = new Date(time);
            const apptTime = apptDate.getHours() * 60 + apptDate.getMinutes();

            const [startH, startM] = startStr.split(':').map(Number);
            const [endH, endM] = endStr.split(':').map(Number);

            const startMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;

            if (apptTime < startMinutes || apptTime > endMinutes) {
                throw new Error(`Appointment time is outside of doctor's consulting hours (${doctor.Consult_Hrs}).`);
            }
        }

        const [result] = await connection.query(
            'INSERT INTO Appointment (Patient_ID, Doctor_ID, Scheduled_Time, Visit_Reason, Status) VALUES (?, ?, ?, ?, "Scheduled")',
            [patientId, doctorId, time, reason]
        );
        // @ts-ignore
        return result.insertId;
    } finally {
        connection.release();
    }
};

export const getAppointments = async (userId: number, role: string) => {
    let query = '';
    let params: any[] = [];

    if (role === 'Patient') {
        // Join with Doctor to get Doctor Name
        query = 'SELECT a.*, d.Full_Name as Doctor_Name, d.Specialization FROM Appointment a JOIN Doctor d ON a.Doctor_ID = d.Doctor_ID WHERE a.Patient_ID = ? ORDER BY a.Scheduled_Time DESC';
        params = [userId];
    } else if (role === 'Doctor') {
        query = 'SELECT * FROM Appointment WHERE Doctor_ID = ?';
        params = [userId];
    } else {
        query = 'SELECT * FROM Appointment';
    }

    const [rows] = await mysqlPool.query(query, params);
    // @ts-ignore
    return rows;
};

export const getDoctorAppointments = async (doctorId: number, date?: string) => {
    let query = 'SELECT a.*, p.Full_Name as Patient_Name FROM Appointment a JOIN Patient p ON a.Patient_ID = p.Patient_ID WHERE a.Doctor_ID = ?';
    const params: any[] = [doctorId];

    if (date) {
        query += ' AND DATE(a.Scheduled_Time) = ?';
        params.push(date);
    }

    query += ' ORDER BY a.Scheduled_Time ASC';

    const [rows] = await mysqlPool.query(query, params);
    return rows;
};
