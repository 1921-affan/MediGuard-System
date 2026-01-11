import mongoose from 'mongoose';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB Connection
export const connectMongo = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/healthcare_db';
        await mongoose.connect(mongoUri);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        process.exit(1);
    }
};

// MySQL Connection Pool
export const mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'healthcare_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export const connectMySQL = async () => {
    try {
        const connection = await mysqlPool.getConnection();
        console.log('MySQL Connected');
        connection.release();
    } catch (error) {
        console.error('MySQL Connection Error:', error);
        // Don't exit process here, maybe just log, as MySQL might be essential but we can retry?
        // Spec says "MySQL (AUTHORITATIVE DATA)", so failure is critical.
        process.exit(1);
    }
};

export const connectDB = async () => {
    await connectMySQL();
    await connectMongo();
};
