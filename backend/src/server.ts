import app from './app';
import dotenv from 'dotenv';
import { mysqlPool, connectMongo } from './config/database';

// Load env vars
dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        console.log('Testing DB Connections...');
        await mysqlPool.query('SELECT 1');
        console.log('MySQL Connected.');

        await connectMongo();
        console.log('MongoDB Connected.');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
