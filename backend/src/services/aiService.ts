import { GoogleGenerativeAI } from '@google/generative-ai';
import { mysqlPool } from '../config/database';
import VitalsLog from '../models/nosql/VitalsLog';
import AIInsight from '../models/nosql/AIInsight';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const analyzeHealth = async (patientId: number, trigger: 'Scheduled' | 'Upload' | 'Doctor' | 'Manual', manualSymptoms?: string) => {
    // 1. Context Retrieval
    const vitalsRaw = await VitalsLog.find({ Patient_ID: patientId })
        .sort({ Timestamp: -1 })
        .limit(20);

    // Format Vitals for AI (Explicit Date/Time)
    const vitals = vitalsRaw.map(v => ({
        Date: new Date(v.Timestamp).toLocaleString(),
        BP: `${v.Systolic_BP}/${v.Diastolic_BP}`,
        HeartRate: v.Heart_Rate,
        Oxygen: v.Oxygen_Level
    }));

    const [history] = await mysqlPool.query(
        'SELECT * FROM Clinical_Record WHERE Patient_ID = ? ORDER BY Visit_Date DESC LIMIT 5',
        [patientId]
    );

    const [prescriptions] = await mysqlPool.query(
        `SELECT p.Dosage, p.Frequency, m.Drug_Name 
         FROM Prescription p 
         JOIN Clinical_Record c ON p.Record_ID = c.Record_ID 
         JOIN Medication m ON p.Med_ID = m.Med_ID
         WHERE c.Patient_ID = ?`,
        [patientId]
    );

    // 2. Construct Prompt
    const prompt = `
    You are an AI Medical Assistant analyzing Patient ${patientId}.
    
    PATIENT REPORTED SYMPTOMS (CURRENT): "${manualSymptoms || 'None reported'}"

    PATIENT DATA:
    Vitals History (Most Recent First): ${JSON.stringify(vitals)}
    Clinical History (Past Diagnoses): ${JSON.stringify(history)}
    Current/Past Prescriptions: ${JSON.stringify(prescriptions)}

    CRITICAL INSTRUCTION: You are a LENIENT screening tool. Prioritize avoiding false alarms.
    IGNORE internal medical knowledge about strict 'Elevated' definitions.
    USE ONLY THE REFERENCE RANGES BELOW.
    
    REFERENCE RANGES (ADULTS) - USE STRICTLY:
    - Systolic BP: <135 mmHg (Normal), 135-139 (Stage 1), >140 (Stage 2/High).
    - Diastolic BP: <85 mmHg (Normal), 85-89 (Stage 1), >90 (Stage 2/High).
    - Heart Rate: 60-100 bpm (Normal).

    TASKS:
    1. Determine Risk Category based ONLY on the table above.
    2. Provide THREE segments in your briefing:
       - Segment 1 (Reasoning): A concise clinical summary (max 3 sentences) for professional context.
       - Segment 2 (Key Factors): A list of specific risk drivers.
       - Segment 3 (Suggestions): Actionable advice for the patient.
         - Lifestyle: Diet, exercise, stress management based on their vitals.
         - Medical: When to contact their doctor, medication adherence reminders.

    STRICT DATA CONSTRAINT:
    - If Recent Vitals are <135/85, Risk Category MUST be 'Low'.

    Output strictly in JSON format (no markdown):
    {
      "riskCategory": "Low" | "Medium" | "High" | "Critical",
      "confidenceScore": number (0-100),
      "reasoning": "Concise clinical summary string",
      "keyFactors": ["string (Factor 1)", "string (Factor 2)"],
      "medicationLinks": ["string (Interactions/Reminders)"],
      "recommendations": { 
        "lifestyle": ["Actionable lifestyle tip 1", "Actionable lifestyle tip 2"], 
        "medical": ["Actionable medical advice 1 (e.g. Consult doctor if...)"] 
      }
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

    Answer the user's question clearly and concisely based on the context. Do not give medical advice that replaces a doctor. If the user asks you about the high risk, explain why based on the factors.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent(prompt);
    return result.response.text();
};
