import mongoose, { Schema, Document } from 'mongoose';

export interface IAIInsight extends Document {
    Patient_ID: number;
    Generated_At: Date;
    Trigger_Source: 'Scheduled' | 'Upload' | 'Doctor';
    Risk_Category: 'Low' | 'Medium' | 'High' | 'Critical';
    Confidence_Score: number;
    RAG_Reasoning: string;
    Rec_Plan_JSON: any; // Storing as Mixed/JSON
    Key_Factors?: string[];
    Medication_Links?: string[];
}

const AIInsightSchema: Schema = new Schema({
    Patient_ID: { type: Number, required: true, index: true }, // FK MySQL
    Generated_At: { type: Date, default: Date.now },
    Trigger_Source: { type: String, enum: ['Scheduled', 'Upload', 'Doctor', 'Manual'], required: true },
    Risk_Category: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
    Confidence_Score: { type: Number, required: true },
    RAG_Reasoning: { type: String, required: true },
    Rec_Plan_JSON: { type: Schema.Types.Mixed, required: true },
    Key_Factors: { type: [String], default: [] },
    Medication_Links: { type: [String], default: [] }
});

export default mongoose.model<IAIInsight>('AI_Insights', AIInsightSchema);
