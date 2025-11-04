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

// IMPORTANT: Set trust proxy BEFORE creating any middleware
// This must be set early for Railway's reverse proxy to work correctly
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3001;

// Configure CORS
const corsOrigin = process.env.CORS_ORIGIN;
const corsOptions = corsOrigin
  ? {
      origin: corsOrigin.split(',').map(origin => origin.trim()),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      optionsSuccessStatus: 200
    }
  : {
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      optionsSuccessStatus: 200
    }; // Default: allow all origins in development

app.use(helmet());
app.use(cors(corsOptions));

// Temporarily disable rate limiting to diagnose Railway deployment issue
// The rate limiter validation was causing SIGTERM on startup
// TODO: Re-enable once trust proxy issue is resolved
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 100 in prod, 1000 in dev
//   message: 'Too many requests from this IP, please try again later.',
//   validate: {
//     trustProxy: false, // Disable trust proxy validation for Railway
//   },
// });
// if (process.env.DISABLE_RATE_LIMIT !== 'true') {
//   app.use(limiter);
// }
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path} from ${req.ip}`);
  next();
});

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

// Root path for Railway health checks
app.get('/', (req, res) => {
  console.log('[HEALTH CHECK] Root endpoint hit');
  res.status(200).send('OK');
});

app.get('/health', (req, res) => {
  console.log('[HEALTH CHECK] Health endpoint hit');
    res.status(200).send({
        success: true,
    });
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
    console.log('[STARTUP] Attempting to connect to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ironlogic4';
    console.log('[STARTUP] MongoDB URI configured:', mongoUri ? 'YES (length: ' + mongoUri.length + ')' : 'NO');

    await mongoose.connect(mongoUri);
    console.log('[STARTUP] MongoDB connected successfully');
  } catch (error) {
    console.error('[STARTUP ERROR] MongoDB connection error:', error);
    process.exit(1);
  }
};

const startServer = async () => {
  console.log('[STARTUP] Starting server initialization...');
  console.log('[STARTUP] Node environment:', process.env.NODE_ENV || 'not set');
  console.log('[STARTUP] Port configured:', PORT);

  try {
    await connectDB();
    console.log('[STARTUP] Database connection complete, starting HTTP server...');

    const server = app.listen(PORT, () => {
      console.log('[STARTUP] ✓ Server successfully running on port', PORT);
      console.log('[STARTUP] Server is ready to accept connections');
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error('[STARTUP ERROR] Port', PORT, 'is already in use');
        console.error('[STARTUP ERROR] Another process is using this port');
      } else {
        console.error('[STARTUP ERROR] Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('[STARTUP ERROR] Failed to start server:', error);
    process.exit(1);
  }
};

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Promise Rejection:', reason);
  console.error('[CRITICAL] Promise:', promise);
});

process.on('uncaughtException', (error) => {
  console.error('[CRITICAL] Uncaught Exception:', error);
  process.exit(1);
});

console.log('[STARTUP] Initializing application...');
startServer().catch((error) => {
  console.error('[STARTUP ERROR] Unhandled error in startServer:', error);
  process.exit(1);
});