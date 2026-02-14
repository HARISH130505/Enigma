import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import gameRoutes from './routes/game';
import round1Routes from './routes/round1';
import round2Routes from './routes/round2';
import round3Routes from './routes/round3';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting - DISABLED FOR DEVELOPMENT
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
//     message: { error: 'Too many requests, please try again later.' }
// });
// app.use(limiter);

// Body parsing
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'operational', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/round1', round1Routes);
app.use('/api/round2', round2Routes);
app.use('/api/round3', round3Routes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
    console.log(`🔐 Mission Enigma Backend running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
