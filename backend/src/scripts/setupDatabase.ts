import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const setup = async () => {
    console.log('Connecting to MySQL...');
    try {
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST || 'localhost',
            user: process.env.MYSQL_USER || 'root',
            password: process.env.MYSQL_PASSWORD || ''
        });

        const dbName = process.env.MYSQL_DATABASE || 'healthcare_db';
        console.log(`Creating Database '${dbName}' if not exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        await connection.query(`USE ${dbName}`);

        console.log('Executing Schema...');
        const schemaPath = path.join(__dirname, '../models/sql/schema.sql');
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found at ${schemaPath}`);
        }

        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        const statements = schemaSql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        for (const stmt of statements) {
            await connection.query(stmt);
        }

        console.log('✅ Database and Tables setup successfully.');
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Database Setup Failed:', error);
        process.exit(1);
    }
};

setup();
