
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AIInsight from '../models/nosql/AIInsight';
import VitalsLog from '../models/nosql/VitalsLog';

dotenv.config();

const connectMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/healthcare_db');
        console.log('MongoDB Connected.');
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        process.exit(1);
    }
};

const checkData = async () => {
    await connectMongo();

    console.log('\n--- Latest 3 AI Insights ---');
    const insights = await AIInsight.find().sort({ Generated_At: -1 }).limit(3);
    if (insights.length === 0) console.log("No AI Insights found.");
    insights.forEach(i => {
        console.log(`\n[${i.Generated_At.toISOString()}] Risk: ${i.Risk_Category}, Confidence: ${i.Confidence_Score}`);
        console.log(`Reasoning: ${i.RAG_Reasoning}`);
    });

    console.log('\n--- Latest 3 Vitals Logs ---');
    const vitals = await VitalsLog.find().sort({ Timestamp: -1 }).limit(3);
    if (vitals.length === 0) console.log("No Vitals Logs found.");
    vitals.forEach(v => {
        console.log(`\n[${v.Timestamp.toISOString()}] HR: ${v.Heart_Rate}, BP: ${v.Systolic_BP}/${v.Diastolic_BP}`);
    });

    await mongoose.disconnect();
};

checkData();
