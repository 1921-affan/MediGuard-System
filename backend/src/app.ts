import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import uploadRoutes from './routes/uploadRoutes';

import clinicalRoutes from './routes/clinicalRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import aiRoutes from './routes/aiRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/clinical', clinicalRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('Health Check: API is running...');
});

export default app;
