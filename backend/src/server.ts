import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import carRoutes from './routes/cars';
import bookingRoutes from './routes/bookings';
import documentRoutes from './routes/documents';
import paymentRoutes from './routes/payments';
import adminRoutes from './routes/admin';
import aiRoutes from './routes/ai';

// Initialize env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Routing
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// Health Check / Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ONLINE',
    message: 'Car Rental Management Platform REST API is running.',
    timestamp: new Date()
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
});
