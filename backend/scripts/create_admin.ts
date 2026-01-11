
import { mysqlPool } from '../config/database';

const promoteToAdmin = async (email: string) => {
    try {
        console.log(`Promoting ${email} to Admin...`);
        const [res] = await mysqlPool.query('UPDATE Users SET Role = "Admin" WHERE Email = ?', [email]);
        // @ts-ignore
        if (res.affectedRows > 0) {
            console.log('Success! User is now an Admin.');
        } else {
            console.log('User not found.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
};

const email = process.argv[2];
if (!email) {
    console.log('Usage: npx ts-node scripts/create_admin.ts <email>');
    process.exit(1);
}

promoteToAdmin(email);
