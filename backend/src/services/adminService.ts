
import { mysqlPool } from '../config/database';

export const getAllUsers = async () => {
    // Union to get all users with their names
    const query = `
        SELECT u.User_ID, u.Email, u.Role, u.Is_Active,
               COALESCE(p.Full_Name, d.Full_Name, 'Admin') as Full_Name,
               COALESCE(p.Phone_No, d.License_No, 'N/A') as Info
        FROM Users u
        LEFT JOIN Patient p ON u.User_ID = p.User_ID AND u.Role = 'Patient'
        LEFT JOIN Doctor d ON u.User_ID = d.User_ID AND u.Role = 'Doctor'
        WHERE u.Role != 'Admin' 
        ORDER BY u.Created_At DESC
    `;
    const [rows] = await mysqlPool.query(query);
    return rows;
};

export const getUserStats = async () => {
    const [counts] = await mysqlPool.query(`
        SELECT 
            SUM(CASE WHEN Role = 'Doctor' THEN 1 ELSE 0 END) as Total_Doctors,
            SUM(CASE WHEN Role = 'Patient' THEN 1 ELSE 0 END) as Total_Patients,
            SUM(CASE WHEN Is_Active = 0 THEN 1 ELSE 0 END) as Pending_Approvals
        FROM Users
    `);
    // @ts-ignore
    return counts[0];
};

export const toggleUserStatus = async (userId: number, isActive: boolean) => {
    await mysqlPool.query('UPDATE Users SET Is_Active = ? WHERE User_ID = ?', [isActive, userId]);
};
