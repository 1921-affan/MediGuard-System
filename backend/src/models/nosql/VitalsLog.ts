import mongoose, { Schema, Document } from 'mongoose';

export interface IVitalsLog extends Document {
    Patient_ID: number;
    Upload_ID: number;
    Timestamp: Date;
    Heart_Rate?: number;
    Systolic_BP?: number;
    Diastolic_BP?: number;
    Sleep_Hours?: number;
    Stress_Level?: string; // Or number, spec says "Stress_Level" usually 1-10 or Low/High. Spec didn't specify type, assuming String or Number. Let's use Number 1-10 based on typical "Level".
    Calorie_Intake?: number;
    Oxygen_Level?: number;
    Symptom_Notes?: string;
}

const VitalsLogSchema: Schema = new Schema({
    Patient_ID: { type: Number, required: true, index: true }, // FK to MySQL Patient_ID
    Upload_ID: { type: Number, required: true, index: true }, // FK to MySQL Upload_ID
    Timestamp: { type: Date, default: Date.now },
    Heart_Rate: { type: Number },
    Systolic_BP: { type: Number },
    Diastolic_BP: { type: Number },
    Oxygen_Level: { type: Number },
    Sleep_Hours: { type: Number },
    Stress_Level: { type: Number },
    Calorie_Intake: { type: Number },
    Symptom_Notes: { type: String }
});

export default mongoose.model<IVitalsLog>('Daily_Vitals_Log', VitalsLogSchema);
