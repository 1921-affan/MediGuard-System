
const API_URL = 'http://localhost:5000/api';

async function post(url: string, data: any, token?: string) {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${url}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(json.message || res.statusText);
        (err as any).response = { data: json };
        throw err;
    }
    return json;
}

async function get(url: string, token: string) {
    const res = await fetch(`${API_URL}${url}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || res.statusText);
    return json;
}

async function runTest() {
    try {
        console.log('--- Starting Clinical Record Verification ---');

        // 1. Register Doctor
        const docEmail = `dr.clinic.${Date.now()}@test.com`;
        console.log(`1. Registering Doctor: ${docEmail}`);
        await post('/auth/register', {
            email: docEmail,
            password: 'password123',
            role: 'Doctor',
            fullName: 'Dr. House'
        });

        const docLogin = await post('/auth/login', { email: docEmail, password: 'password123' });
        const docToken = docLogin.token;
        const docProfile = await get('/auth/profile', docToken);
        const doctorId = docProfile.Doctor_ID;

        // 2. Register Patient
        const patEmail = `pat.clinic.${Date.now()}@test.com`;
        console.log(`2. Registering Patient: ${patEmail}`);
        await post('/auth/register', {
            email: patEmail,
            password: 'password123',
            role: 'Patient',
            fullName: 'Clinic Test Patient'
        });

        const patLogin = await post('/auth/login', { email: patEmail, password: 'password123' });
        const patToken = patLogin.token;
        const patProfile = await get('/auth/profile', patToken);
        const patientId = patProfile.Patient_ID;

        // 3. Add Clinical Record (Doctor -> Patient)
        console.log('3. Doctor adding clinical record...');
        await post('/clinical', {
            patientId: patientId,
            doctorId: doctorId,
            diagnosis: 'Acute Viral Infection',
            symptoms: 'High fever, cough, fatigue',
            remarks: 'Prescribed rest and hydration.',
            followUpDate: '2025-12-30',
            prescriptions: [
                { drugName: 'Paracetamol', dosage: '500mg', frequency: 'Twice a day', duration: '5 days' }
            ]
        }, docToken);

        // 4. Patient Fetch History
        console.log('4. Patient fetching history...');
        const history = await get(`/clinical/${patientId}`, patToken);
        console.log('   History retrieved:', history.length, 'records.');

        if (history.length > 0 && history[0].Doctor_Name === 'Dr. House') {
            console.log('   SUCCESS: Record found with correct Doctor Name.');
            console.log('   Diagnosis:', history[0].Diagnosis_ICD10);
        } else {
            console.error('   FAILURE: Record not found or incorrect data.');
        }

    } catch (err: any) {
        console.error('TEST FAILED:', err.message, err.response?.data);
    }
}

runTest();
