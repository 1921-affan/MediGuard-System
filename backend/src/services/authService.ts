import { mysqlPool } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Types
interface UserData {
    email: string;
    password: string;
    role: 'Patient' | 'Doctor' | 'Admin';
    fullName?: string; // For Patient/Doctor creation
}

export const registerUser = async (userData: UserData) => {
    const connection = await mysqlPool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Check if user exists
        const [existing] = await connection.query('SELECT * FROM Users WHERE Email = ?', [userData.email]);
        // @ts-ignore
        if (existing.length > 0) {
            throw new Error('User already exists');
        }

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        // 3. Insert User
        const [userResult] = await connection.query(
            'INSERT INTO Users (Email, Password_Hash, Role) VALUES (?, ?, ?)',
            [userData.email, hashedPassword, userData.role]
        );
        // @ts-ignore
        const userId = userResult.insertId;

        // 4. Create Role specific profile
        if (userData.role === 'Patient') {
            await connection.query(
                'INSERT INTO Patient (User_ID, Full_Name, DOB, Gender) VALUES (?, ?, ?, ?)',
                [userId, userData.fullName || 'New Patient', '2000-01-01', 'Male'] // Default placeholder, strictly, should be passed
            );
        } else if (userData.role === 'Doctor') {
            await connection.query(
                'INSERT INTO Doctor (User_ID, Full_Name, License_No) VALUES (?, ?, ?)',
                [userId, userData.fullName || 'New Doctor', `LIC-${Date.now()}`]
            );
        }
        // Admin doesn't need extra table usually, or maybe Users table is enough.

        await connection.commit();
        return { userId, role: userData.role };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const loginUser = async (email: string, password: string) => {
    const [rows] = await mysqlPool.query('SELECT * FROM Users WHERE Email = ?', [email]);
    // @ts-ignore
    const user = rows[0];

    if (!user) {
        throw new Error('User not found');
    }

    const validPass = await bcrypt.compare(password, user.Password_Hash);
    if (!validPass) {
        throw new Error('Invalid password');
    }

    if (!user.Is_Active) {
        throw new Error('User account is inactive');
    }

    const token = jwt.sign(
        { id: user.User_ID, role: user.Role },
        process.env.JWT_SECRET as string,
        { expiresIn: '1d' }
    );

    return { token, user: { id: user.User_ID, email: user.Email, role: user.Role } };
};

export const getProfile = async (userId: number, role: 'Patient' | 'Doctor' | 'Admin') => {
    if (role === 'Admin') return {}; // Admin has no profile table for now

    const table = role === 'Patient' ? 'Patient' : 'Doctor';
    const [rows] = await mysqlPool.query(`SELECT * FROM ${table} WHERE User_ID = ?`, [userId]);
    // @ts-ignore
    return rows[0];
};

export const updateProfile = async (userId: number, role: 'Patient' | 'Doctor' | 'Admin', data: any) => {
    if (role === 'Admin') return;

    // Filter updates based on Role to avoid SQL injection or invalid columns
    // Construct dynamic update query
    const table = role === 'Patient' ? 'Patient' : 'Doctor';
    const allowedFields = role === 'Patient'
        ? ['Full_Name', 'DOB', 'Gender', 'Blood_Group', 'Phone_No', 'Lifestyle_Activity', 'Diet_Pref']
        : ['Full_Name', 'Specialization', 'License_No', 'Gender', 'Years_Experience', 'Consult_Hrs', 'Hospital_Affiliation'];

    const updates: string[] = [];
    const values: any[] = [];

    for (const key of Object.keys(data)) {
        if (allowedFields.includes(key)) {
            updates.push(`${key} = ?`);
            values.push(data[key]);
        }
    }

    if (updates.length === 0) return; // Nothing to update

    values.push(userId);
    await mysqlPool.query(`UPDATE ${table} SET ${updates.join(', ')} WHERE User_ID = ?`, values);
};

export const getAllDoctors = async () => {
    const [rows] = await mysqlPool.query('SELECT Doctor_ID, Full_Name, Specialization, Consult_Hrs FROM Doctor');
    return rows;
};

export const getAllPatients = async () => {
    const [rows] = await mysqlPool.query('SELECT Patient_ID, Full_Name, DOB, Gender FROM Patient');
    return rows;
};

export const searchPatients = async (term: string) => {
    const searchTerm = `%${term}%`;
    const [rows] = await mysqlPool.query(
        'SELECT Patient_ID, Full_Name, DOB, Gender, Phone_No FROM Patient WHERE Full_Name LIKE ? OR Phone_No LIKE ? LIMIT 10',
        [searchTerm, searchTerm]
    );
    return rows;
};
