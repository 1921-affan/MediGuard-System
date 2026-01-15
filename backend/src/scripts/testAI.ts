import { mysqlPool, connectMongo } from '../config/database';
import * as aiService from '../services/aiService';
import dotenv from 'dotenv';
dotenv.config();

const runTest = async () => {
    console.log('--- AI SDK Test (gemini-pro-latest) ---');

    try {
        await connectMongo();
        const [rows] = await mysqlPool.query("SELECT Patient_ID FROM Patient WHERE Full_Name LIKE '%Affan Yasir%'");
        // @ts-ignore
        if (rows.length === 0) {
            console.error('Patient Affan Yasir not found.');
            return;
        }
        // @ts-ignore
        const patientId = rows[0].Patient_ID;
        console.log(`Analyzing for Patient ID: ${patientId}`);

        const result = await aiService.analyzeHealth(patientId, 'Upload');
        console.log('Analysis Success:', result);

    } catch (error) {
        console.error('Analysis Failed:', error);
    } finally {
        process.exit();
    }
};

runTest();
