
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Dummy Vitals Data - Matches 'normal_vitals.csv'
const mockVitals = [
    { Timestamp: '2025-01-16T12:00:00.000Z', Systolic_BP: 125, Diastolic_BP: 82, Heart_Rate: 78, Body_Temp: 98.8, Oxygen_Saturation: 97 },
    { Timestamp: '2025-01-16T11:00:00.000Z', Systolic_BP: 122, Diastolic_BP: 81, Heart_Rate: 74, Body_Temp: 98.6, Oxygen_Saturation: 98 }
];

const mockHistory: any[] = [];
const mockPrescriptions: any[] = [];

const prompt = `
    You are an AI Medical Assistant. 
    CRITICAL INSTRUCTION: You are a LENIENT screening tool. 
    IGNORE your internal medical knowledge about strict "Elevated" or "Pre-hypertension" definitions. 
    USE ONLY THE REFERENCE RANGES PROVIDED BELOW. If a value is "Normal" per this table, it is LOW RISK.

    REFERENCE RANGES (ADULTS) - USE THESE STRICTLY:
    - Systolic BP: <135 mmHg (Normal), >135 (High).
    - Diastolic BP: <85 mmHg (Normal), >85 (High).
    - Heart Rate: 60-100 bpm (Normal).
    
    Tasks:
    1. Determine Risk Category based ONLY on the table above.
       - 'Low': Vitals are within the "Normal" range defined above (BP < 135/85).
       - 'Medium': One or more vitals are slightly above Normal.
       - 'High': Significant deviation.
       - 'Critical': Emergency values.
    
    STRICT DATA CONSTRAINT:
    - If Systolic BP < 135 AND Diastolic BP < 85, Risk Category MUST be 'Low'.
    - Output 'Low' for 125/82.

    Output strictly in JSON format (no markdown):
    {
      "riskCategory": "Low" | "Medium" | "High" | "Critical",
      "confidenceScore": 0-100,
      "reasoning": "string"
    }
`;

async function runTest() {
    console.log("Running AI Test with Normal Vitals...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest", generationConfig: { responseMimeType: "application/json" } });
        const result = await model.generateContent(prompt);
        console.log("Response Raw Text:", result.response.text());
        const parsed = JSON.parse(result.response.text());
        console.log("Parsed Risk Category:", parsed.riskCategory);
        console.log("Reasoning:", parsed.reasoning);

        if (parsed.riskCategory === 'Low') {
            console.log("SUCCESS: Correctly identified Low Risk.");
            process.exit(0);
        } else {
            console.error("FAILURE: Incorrectly identified risk as", parsed.riskCategory);
            process.exit(1);
        }

    } catch (e) {
        console.error("Error during test:", e);
        process.exit(1);
    }
}

runTest();
