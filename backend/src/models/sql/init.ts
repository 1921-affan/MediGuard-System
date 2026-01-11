import { mysqlPool } from '../../config/database';
import fs from 'fs';
import path from 'path';

export const initMySQL = async () => {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Split by semicolon to execute statements individually
        // Removing empty lines/comments handling is basic here
        const statements = schemaSql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        const connection = await mysqlPool.getConnection();

        console.log('Initializing MySQL Tables...');
        for (const stmt of statements) {
            await connection.query(stmt);
        }

        console.log('MySQL Tables Initialized.');
        connection.release();
    } catch (error) {
        console.error('Error initializing MySQL tables:', error);
        process.exit(1);
    }
};
