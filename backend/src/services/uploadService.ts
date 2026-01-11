import { mysqlPool } from '../config/database';
import VitalsLog from '../models/nosql/VitalsLog';
import csv from 'csv-parser';
import fs from 'fs';
import { RowDataPacket } from 'mysql2';

interface UploadResult {
    totalRows: number;
    successCount: number;
    failedCount: number;
    uploadId: number;
}

export const processUpload = async (filePath: string, fileName: string, patientId: number, fileSize: number): Promise<UploadResult> => {
    // 1. Create Upload Metadata Record (Pending)
    const connection = await mysqlPool.getConnection();
    let uploadId = 0;

    try {
        const [result] = await connection.query(
            'INSERT INTO Upload_Metadata (Patient_ID, File_Name, File_Size_KB, Processing_Status) VALUES (?, ?, ?, ?)',
            [patientId, fileName, fileSize / 1024, 'Pending']
        );
        // @ts-ignore
        uploadId = result.insertId;
    } finally {
        connection.release();
    }

    const results: any[] = [];
    const errors: any[] = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                let successCount = 0;
                let failedCount = 0;

                try {
                    // Process Rows
                    const validDocs = [];
                    for (const row of results) {
                        try {
                            // Basic Validation
                            if (!row.Heart_Rate || !row.Systolic_BP) {
                                throw new Error('Missing core vitals');
                            }

                            validDocs.push({
                                Patient_ID: patientId,
                                Upload_ID: uploadId,
                                Timestamp: new Date(), // Or from row if available
                                Heart_Rate: parseFloat(row.Heart_Rate),
                                Systolic_BP: parseFloat(row.Systolic_BP),
                                Diastolic_BP: parseFloat(row.Diastolic_BP),
                                Sleep_Hours: parseFloat(row.Sleep_Hours || '0'),
                                Stress_Level: parseFloat(row.Stress_Level || '0'),
                                Calorie_Intake: parseFloat(row.Calorie_Intake || '0'),
                                Symptom_Notes: row.Symptom_Notes || ''
                            });
                            successCount++;
                        } catch (err) {
                            failedCount++;
                            errors.push({ row, err });
                        }
                    }

                    // Bulk Insert into Mongo
                    if (validDocs.length > 0) {
                        await VitalsLog.insertMany(validDocs);
                    }

                    // Update Metadata
                    const finalStatus = failedCount === 0 ? 'Processed' : (successCount > 0 ? 'Processed' : 'Failed'); // Or 'Partial' if we had that enum
                    // Spec says: 'Pending', 'Processed', 'Failed'. If some Valid, we say Processed? Or if any invalid -> Failed?
                    // "Invalid rows: Are rejected. Valid rows: Inserted." So partial success is allowed.
                    // But typically "Processing_Status" refers to the batch. I'll mark 'Processed' if batch finished, even with errors, or maybe 'Processed' means COMPLETE success? 
                    // Let's stick to 'Processed' if at least one row made it effectively, or just that the JOB finished.

                    const connection = await mysqlPool.getConnection();
                    await connection.query(
                        'UPDATE Upload_Metadata SET Total_Rows = ?, Processing_Status = ? WHERE Upload_ID = ?',
                        [results.length, finalStatus, uploadId]
                    );
                    connection.release();

                    resolve({ totalRows: results.length, successCount, failedCount, uploadId });

                } catch (error) {
                    reject(error);
                } finally {
                    // Cleanup file
                    fs.unlinkSync(filePath);
                }
            });
    });
};
