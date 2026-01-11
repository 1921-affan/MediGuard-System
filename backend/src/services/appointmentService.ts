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
    let query = 'SELECT * FROM Appointment';
    let params: any[] = [];

    if (role === 'Patient') {
        // Need to join to find Patient_ID from User_ID first or assume passed. 
        // For simplicity, assuming caller passes Patient_ID not User_ID, OR we join.
        // Let's assume we pass the relevant ID.
        query += ' WHERE Patient_ID = ?';
        params = [userId];
    } else if (role === 'Doctor') {
        query += ' WHERE Doctor_ID = ?';
        params = [userId];
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
