import { mysqlPool } from '../config/database';
import AIInsight from '../models/nosql/AIInsight';

export const createRecord = async (data: any) => {
    const connection = await mysqlPool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Insert Clinical Record
        const [result] = await connection.query(
            'INSERT INTO Clinical_Record (Patient_ID, Doctor_ID, Diagnosis_ICD10, Symptoms_Text, Doctor_Remarks, Follow_Up_Date) VALUES (?, ?, ?, ?, ?, ?)',
            [data.patientId, data.doctorId, data.diagnosis, data.symptoms, data.remarks, data.followUpDate]
        );
        // @ts-ignore
        const recordId = result.insertId;

        // 2. Insert Prescriptions (if any)
        if (data.prescriptions && Array.isArray(data.prescriptions)) {
            for (const prez of data.prescriptions) {
                // Check if Med exists or create
                // For simplicity in this prototype, we'll try to find by Name, or Create
                let medId;
                const [medRows] = await connection.query('SELECT Med_ID FROM Medication WHERE Drug_Name = ?', [prez.drugName]);
                // @ts-ignore
                if (medRows.length > 0) {
                    // @ts-ignore
                    medId = medRows[0].Med_ID;
                } else {
                    const [newMed] = await connection.query('INSERT INTO Medication (Drug_Name) VALUES (?)', [prez.drugName]);
                    // @ts-ignore
                    medId = newMed.insertId;
                }

                await connection.query(
                    'INSERT INTO Prescription (Record_ID, Med_ID, Dosage, Frequency, Duration) VALUES (?, ?, ?, ?, ?)',
                    [recordId, medId, prez.dosage, prez.frequency, prez.duration]
                );
            }
        }

        await connection.commit();
        return recordId;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

export const getHistory = async (patientId: number) => {
    const [rows] = await mysqlPool.query(
        `SELECT c.*, d.Full_Name as Doctor_Name 
         FROM Clinical_Record c 
         LEFT JOIN Doctor d ON c.Doctor_ID = d.Doctor_ID 
         WHERE c.Patient_ID = ? 
         ORDER BY c.Visit_Date DESC`,
        [patientId]
    );
    return rows;
};

export const getPatientsByDoctor = async (doctorId: number) => {
    // Fetch patients who have either an appointment or a clinical record with this doctor
    const query = `
        SELECT DISTINCT p.* 
        FROM Patient p
        LEFT JOIN Clinical_Record cr ON p.Patient_ID = cr.Patient_ID
        LEFT JOIN Appointment a ON p.Patient_ID = a.Patient_ID
        WHERE cr.Doctor_ID = ? OR a.Doctor_ID = ?
    `;
    const [rows] = await mysqlPool.query(query, [doctorId, doctorId]);

    // Enrich with AI Risk Data
    const patientsWithRisk = await Promise.all((rows as any[]).map(async (patient) => {
        const latestInsight = await AIInsight.findOne({ Patient_ID: patient.Patient_ID }).sort({ Generated_At: -1 });
        return {
            ...patient,
            Latest_Risk: latestInsight ? latestInsight.Risk_Category : 'Unknown',
            Latest_Insight_Date: latestInsight ? latestInsight.Generated_At : null
        };
    }));

    return patientsWithRisk;
};

export const searchMedications = async (query: string) => {
    const sql = `SELECT * FROM Medication WHERE Drug_Name LIKE ? LIMIT 10`;
    const [rows] = await mysqlPool.query(sql, [`%${query}%`]);
    return rows;
};
