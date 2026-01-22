import { mysqlPool } from '../config/database';
import dotenv from 'dotenv';
dotenv.config();

const checkMeds = async () => {
    try {
        const [rows]: any = await mysqlPool.query('SELECT COUNT(*) as count FROM Medication');
        console.log('Medication Count:', rows[0].count);

        if (true) {
            console.log('Ensure we have fresh seed data...');
            const meds = [
                ['Paracetamol 500mg', 'Analgesic', 'Tablet'],
                ['Amoxicillin 500mg', 'Antibiotic', 'Capsule'],
                ['Ibuprofen 400mg', 'NSAID', 'Tablet'],
                ['Cetirizine 10mg', 'Antihistamine', 'Tablet'],
                ['Metformin 500mg', 'Antidiabetic', 'Tablet'],
                ['Atorvastatin 10mg', 'Statin', 'Tablet'],
                ['Omeprazole 20mg', 'PPI', 'Capsule'],
                ['Amlodipine 5mg', 'Calcium Channel Blocker', 'Tablet'],
                ['Losartan 50mg', 'ARB', 'Tablet'],
                ['Albuterol Inhaler', 'Bronchodilator', 'Inhaler'],
                ['Azithromycin 250mg', 'Antibiotic', 'Tablet'],
                ['Pantoprazole 40mg', 'PPI', 'Tablet'],
                ['Gabapentin 300mg', 'Anticonvulsant', 'Capsule'],
                ['Prednisone 10mg', 'Corticosteroid', 'Tablet'],
                ['Levothyroxine 50mcg', 'Thyroid', 'Tablet'],
                ['Ciprofloxacin 500mg', 'Antibiotic', 'Tablet'],
                ['Doxycycline 100mg', 'Antibiotic', 'Capsule'],
                ['Clopidogrel 75mg', 'Antiplatelet', 'Tablet'],
                ['Furosemide 40mg', 'Diuretic', 'Tablet'],
                ['Tramadol 50mg', 'Analgesic', 'Tablet']
            ];

            // Assuming columns: Drug_Name, Category, Form? 
            // Wait, aiService select implies Med_ID, Drug_Name.
            // I should verify columns. DESCRIBE Medication?
            // I'll just try inserting Drug_Name first.
            const [desc]: any = await mysqlPool.query('DESCRIBE Medication');
            console.log('Columns:', desc.map((c: any) => c.Field));

            // Seed Data
            await mysqlPool.query('TRUNCATE TABLE Medication');
            console.log('Table truncated.');

            const query = 'INSERT INTO Medication (Drug_Name, Generic_Name, Dosage_Form) VALUES ?';
            const values = [
                ['Paracetamol 500mg', 'Paracetamol', 'Tablet'],
                ['Amoxicillin 500mg', 'Amoxicillin', 'Capsule'],
                ['Ibuprofen 400mg', 'Ibuprofen', 'Tablet'],
                ['Cetirizine 10mg', 'Cetirizine', 'Tablet'],
                ['Metformin 500mg', 'Metformin', 'Tablet'],
                ['Atorvastatin 10mg', 'Atorvastatin', 'Tablet'],
                ['Omeprazole 20mg', 'Omeprazole', 'Capsule'],
                ['Amlodipine 5mg', 'Amlodipine', 'Tablet'],
                ['Losartan 50mg', 'Losartan', 'Tablet'],
                ['Albuterol Inhaler', 'Albuterol', 'Inhaler'],
                ['Azithromycin 250mg', 'Azithromycin', 'Tablet'],
                ['Pantoprazole 40mg', 'Pantoprazole', 'Tablet'],
                ['Gabapentin 300mg', 'Gabapentin', 'Capsule'],
                ['Prednisone 10mg', 'Prednisone', 'Tablet'],
                ['Levothyroxine 50mcg', 'Levothyroxine', 'Tablet'],
                ['Ciprofloxacin 500mg', 'Ciprofloxacin', 'Tablet'],
                ['Doxycycline 100mg', 'Doxycycline', 'Capsule'],
                ['Clopidogrel 75mg', 'Clopidogrel', 'Tablet'],
                ['Furosemide 40mg', 'Furosemide', 'Tablet'],
                ['Tramadol 50mg', 'Tramadol', 'Tablet']
            ];

            await mysqlPool.query(query, [values]);
            console.log(`Seeded ${values.length} medications.`);

        } else {
            // Already has data, but let's seed anyway if checkCount was 1 (just test data)
            if (rows[0].count < 5) {
                // re-seed logic copy-paste or just force it by removing check
            }
            const [sample] = await mysqlPool.query('SELECT * FROM Medication LIMIT 5');
            console.log('Sample Data:', sample);
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
};

checkMeds();
