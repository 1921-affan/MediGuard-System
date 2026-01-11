import { GoogleGenerativeAI } from '@google/generative-ai';
import { mysqlPool } from '../config/database';
import VitalsLog from '../models/nosql/VitalsLog';
import AIInsight from '../models/nosql/AIInsight';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const analyzeHealth = async (patientId: number, trigger: 'Scheduled' | 'Upload' | 'Doctor') => {
    // 1. Context Retrieval
    const vitals = await VitalsLog.find({ Patient_ID: patientId })
        .sort({ Timestamp: -1 })
        .limit(20);

    const [history] = await mysqlPool.query(
        'SELECT * FROM Clinical_Record WHERE Patient_ID = ? ORDER BY Visit_Date DESC LIMIT 5',
        [patientId]
    );

    const [prescriptions] = await mysqlPool.query(
        `SELECT p.*, m.Drug_Name 
         FROM Prescription p 
         JOIN Clinical_Record c ON p.Record_ID = c.Record_ID 
         JOIN Medication m ON p.Med_ID = m.Med_ID
         WHERE c.Patient_ID = ?`,
        [patientId]
    );

    // 2. Construct Prompt
    const prompt = `
    You are an AI Medical Assistant. Analyze the following patient data to detect health risks.
    
    Patient ID: ${patientId}
    
    Recent Vitals (Last 20 readings):
    ${JSON.stringify(vitals)}
    
    Clinical History (Last 5 records):
    ${JSON.stringify(history)}
    
    Current Medications:
    ${JSON.stringify(prescriptions)}
    
    Tasks:
    1. Identify any health risks based on trends (e.g., rising BP, high stress).
    2. Check for medication interactions or contraindications.
    3. Determine Risk Category: 'Low', 'Medium', 'High', 'Critical'.
    4. Provide reasoning (RAG Reasoning).
    5. Recommend a plan.
    
    Output strictly in JSON format (do not use markdown code blocks):
    {
      "riskCategory": "Low" | "Medium" | "High" | "Critical",
      "confidenceScore": 0-100,
      "reasoning": "string",
      "recommendations": { "lifestyle": ["str"], "medical": ["str"] }
    }
    `;

    // 3. Call Gemini
    try {
        console.log('Gemini API Key Present:', !!process.env.GEMINI_API_KEY);
        // Using standard gemini-pro for best availability
        // Some keys/regions may not support 1.5-flash yet
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = result.response;
        // Clean markdown code blocks if Gemini adds them
        let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        const parsedResult = JSON.parse(text);

        // 4. Store Insight
        const insight = new AIInsight({
            Patient_ID: patientId,
            Trigger_Source: trigger,
            Risk_Category: parsedResult.riskCategory,
            Confidence_Score: parsedResult.confidenceScore,
            RAG_Reasoning: parsedResult.reasoning,
            Rec_Plan_JSON: parsedResult.recommendations
        });
        await insight.save();

        if (parsedResult.riskCategory === 'High' || parsedResult.riskCategory === 'Critical') {
            // Logic for high risk alert
        }

        return insight;

    } catch (error) {
        console.error('AI Analysis Failed:', error);
        throw error;
    }
};
