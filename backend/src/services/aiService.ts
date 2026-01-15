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
    You are an AI Medical Assistant. Analyze the patient data to assess health conditions and risks.
    
    Patient ID: ${patientId}
    
    Recent Vitals (Last 20 readings):
    ${JSON.stringify(vitals)}
    
    Clinical History (Last 5 records):
    ${JSON.stringify(history)}
    
    Current Medications:
    ${JSON.stringify(prescriptions)}
    
    Tasks:
    1. Identify health risks/conditions based on trends (e.g., "Stage 2 Hypertension identified based on consistent >160 systolic").
    2. Check for medication interactions or correlations (e.g., "Bradycardia possibly linked to Atenolol").
    3. Determine Risk Category: 'Low', 'Medium', 'High', 'Critical'.
    4. Provide detailed reasoning (Health Conditions).
    
    Output strictly in JSON format (no markdown):
    {
      "riskCategory": "Low" | "Medium" | "High" | "Critical",
      "confidenceScore": 0-100,
      "reasoning": "string (Summary of health conditions)",
      "keyFactors": ["string (Specific readings/triggers, e.g. 'Systolic BP 162 at 10:00')"],
      "medicationLinks": ["string (Observation linked to med, e.g. 'Dizziness may be side effect of X')"],
      "recommendations": { "lifestyle": ["str"], "medical": ["str"] }
    }
    `;

    // 3. Call Gemini
    try {
        // Use flash for speed
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest", generationConfig: { responseMimeType: "application/json" } });
        const result = await model.generateContent(prompt);
        const response = result.response;
        // Clean markdown code blocks if necessary (1.5-flash usually respects mimeType better)
        let text = response.text();
        if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsedResult = JSON.parse(text);

        // 4. Store Insight
        const insight = new AIInsight({
            Patient_ID: patientId,
            Trigger_Source: trigger,
            Risk_Category: parsedResult.riskCategory,
            Confidence_Score: parsedResult.confidenceScore,
            RAG_Reasoning: parsedResult.reasoning,
            Rec_Plan_JSON: parsedResult.recommendations || {},
            Key_Factors: parsedResult.keyFactors || [],
            Medication_Links: parsedResult.medicationLinks || []
        });
        await insight.save();

        return insight;

    } catch (error) {
        console.error('AI Analysis Failed:', error);
        throw error;
    }
};

export const chatWithAI = async (patientId: number, message: string, contextId?: string) => {
    // Retrieve context if provided (e.g., specific insight ID)
    let contextData = "";
    if (contextId) {
        const insight = await AIInsight.findById(contextId);
        if (insight) {
            contextData = `
            Context from previous analysis (Risk: ${insight.Risk_Category}):
            Reasoning: ${insight.RAG_Reasoning}
            Key Factors: ${insight.Key_Factors ? insight.Key_Factors.join(', ') : ''}
            `;
        }
    }

    // New Prompt
    const prompt = `
    You are a helpful AI Medical Assistant for Patient ${patientId}.
    Context:
    ${contextData}

    User Question: "${message}"

    Answer the user's question clearly and concisely based on the context. Do not give medical advice that replaces a doctor. If the user asks about the high risk, explain why based on the factors.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent(prompt);
    return result.response.text();
};
