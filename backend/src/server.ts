// ─── AssetFlow API Server ───────────────────────────────────────────────────
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';

import env from './config/env';
import prisma from './config/database';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { apiLimiter } from './middlewares/rateLimiter';

// ─── Route imports ──────────────────────────────────────────────────────────
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import departmentRoutes from './routes/department.routes';
import categoryRoutes from './routes/category.routes';
import assetRoutes from './routes/asset.routes';
import allocationRoutes from './routes/allocation.routes';
import bookingRoutes from './routes/booking.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import auditRoutes from './routes/audit.routes';
import dashboardRoutes from './routes/dashboard.routes';
import notificationRoutes from './routes/notification.routes';
import activityLogRoutes from './routes/activitylog.routes';
import organizationRoutes from './routes/organization.routes';
import onboardingRoutes from './routes/onboarding.routes';
import assetRequestRoutes from './routes/assetRequest.routes';
import employeeRoutes from './routes/employee.routes';
import aiVoiceRoutes from './routes/aiVoice.routes';
import webhookRoutes from './routes/webhook.routes';

const app = express();

// ─── Global Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.includes('vercel.app') || origin.includes('localhost') || env.CORS_ORIGIN === '*') {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(apiLimiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Health Check ───────────────────────────────────────────────────────────
import mongoose from 'mongoose';

app.get('/api/health', (_req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const omnidimStatus = Boolean(process.env.OMNIDIM_API_KEY) ? 'configured' : 'ready_pending_key';

  res.json({
    success: true,
    status: 'healthy',
    message: 'StockSense Inventory Management API is operating normally',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    services: {
      backend: 'online',
      database: dbStatus,
      omnidimension: omnidimStatus,
      emailjs: Boolean(process.env.EMAILJS_SERVICE_ID) ? 'configured' : 'development_logger',
    },
  });
});

import stockSenseRoutes from './routes/stocksense.routes';
import { connectDB } from './config/db';

// ─── StockSense Primary Enterprise Routes ──────────────────────────────────
app.use('/api', stockSenseRoutes);

// ─── Legacy Supporting Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/maintenance', maintenanceRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/asset-requests', assetRequestRoutes);
app.use('/api/ai-voice', aiVoiceRoutes);
app.use('/api/integrations/omnidimension', webhookRoutes);
app.use('/api/omnidimension', webhookRoutes);

// ─── Error Handling ─────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────────────────────
const PORT = env.PORT;

async function bootstrap() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Auto-seed required system roles if missing
    await Promise.all([
      prisma.role.upsert({ where: { name: 'Administrator' }, update: {}, create: { name: 'Administrator' } }),
      prisma.role.upsert({ where: { name: 'Asset Manager' }, update: {}, create: { name: 'Asset Manager' } }),
      prisma.role.upsert({ where: { name: 'Department Head' }, update: {}, create: { name: 'Department Head' } }),
      prisma.role.upsert({ where: { name: 'Employee' }, update: {}, create: { name: 'Employee' } }),
    ]);
    console.log('✅ System roles verified');

    // Ensure administrators do not have forcePasswordChange set to true in database
    await prisma.user.updateMany({
      where: { role: { name: { in: ['Administrator', 'Asset Manager'] } } },
      data: { forcePasswordChange: false },
    });

    // Auto-seed default asset categories if missing
    const DEFAULT_ASSET_CATEGORIES = [
      { name: 'Laptop', description: 'Laptops, notebooks, and portable workstations', iconName: 'Laptop' },
      { name: 'Desktop', description: 'Desktop computers, towers, and all-in-one workstations', iconName: 'Monitor' },
      { name: 'Monitor', description: 'Displays, external monitors, and presentation screens', iconName: 'Monitor' },
      { name: 'Printer', description: 'Printers, scanners, and multi-function copiers', iconName: 'Printer' },
      { name: 'Projector', description: 'Projectors and audiovisual presentation equipment', iconName: 'Projector' },
      { name: 'Mobile Phone', description: 'Smartphones and mobile communication devices', iconName: 'Smartphone' },
      { name: 'Tablet', description: 'Tablets, iPads, and handheld touch devices', iconName: 'Tablet' },
      { name: 'Server', description: 'Rack servers, blade servers, and datacenter hardware', iconName: 'Server' },
      { name: 'Networking Equipment', description: 'Routers, switches, access points, and network hardware', iconName: 'Network' },
      { name: 'Furniture', description: 'Desks, chairs, conference tables, and office furnishings', iconName: 'Armchair' },
      { name: 'Vehicle', description: 'Company cars, vans, and transport fleet vehicles', iconName: 'Car' },
      { name: 'Other', description: 'Miscellaneous equipment, tools, and accessories', iconName: 'Package' },
    ];

    for (const cat of DEFAULT_ASSET_CATEGORIES) {
      const existing = await prisma.assetCategory.findFirst({
        where: { name: { equals: cat.name } },
      });
      if (!existing) {
        if (cat.name === 'Networking Equipment') {
          const legacy = await prisma.assetCategory.findFirst({
            where: { name: { equals: 'Networking' } },
          });
          if (legacy) {
            await prisma.assetCategory.update({
              where: { id: legacy.id },
              data: { name: 'Networking Equipment', description: cat.description, iconName: cat.iconName, status: 'ACTIVE' },
            });
            continue;
          }
        }
        await prisma.assetCategory.create({
          data: {
            name: cat.name,
            description: cat.description,
            iconName: cat.iconName,
            status: 'ACTIVE',
          },
        });
      }
    }
    console.log('✅ Asset categories verified');

    app.listen(PORT, () => {
      console.log(`\n🚀 AssetFlow API Server`);
      console.log(`   Environment: ${env.NODE_ENV}`);
      console.log(`   Port:        ${PORT}`);
      console.log(`   API:         http://localhost:${PORT}/api`);
      console.log(`   Health:      http://localhost:${PORT}/api/health`);
      console.log(`   CORS:        ${env.CORS_ORIGIN}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
