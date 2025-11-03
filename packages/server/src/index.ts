import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import adminUserRoutes from './routes/admin/users.js';
import adminGymRoutes from './routes/admin/gyms.js';
import gymActivityTemplateRoutes from './routes/gym/activityTemplates.js';
import gymActivityGroupRoutes from './routes/gym/activityGroups.js';
import gymClientRoutes from './routes/gym/clients.js';
import gymCoachRoutes from './routes/gym/coaches.js';
import gymBenchmarkTemplateRoutes from './routes/gym/benchmarkTemplates.js';
import gymProgramRoutes from './routes/gym/programs.js';
import gymScheduleRoutes from './routes/gym/schedules.js';
import meRoutes from './routes/me/index.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 100 in prod, 1000 in dev
  message: 'Too many requests from this IP, please try again later.'
});

// Configure CORS
const corsOrigin = process.env.CORS_ORIGIN;
const corsOptions = corsOrigin
  ? {
      origin: corsOrigin.split(',').map(origin => origin.trim()),
      credentials: true,
    }
  : {}; // Default: allow all origins in development

app.use(helmet());
app.use(cors(corsOptions));

// Only apply rate limiting if not explicitly disabled
if (process.env.DISABLE_RATE_LIMIT !== 'true') {
  app.use(limiter);
}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/gyms', adminGymRoutes);
app.use('/api/gym/activity-templates', gymActivityTemplateRoutes);
app.use('/api/gym/activity-groups', gymActivityGroupRoutes);
app.use('/api/gym/clients', gymClientRoutes);
app.use('/api/gym/coaches', gymCoachRoutes);
app.use('/api/gym/benchmark-templates', gymBenchmarkTemplateRoutes);
app.use('/api/gym/programs', gymProgramRoutes);
app.use('/api/gym/schedules', gymScheduleRoutes);
app.use('/api/me', meRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/ip', (req, res) => {
    res.json({
        ip: req.ip,
        ips: req.ips,
        headers: {
            'x-forwarded-for': req.headers['x-forwarded-for']
        }
    });
});

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ironlogic4';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch(console.error);