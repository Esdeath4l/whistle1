import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { handleDemo } from "./routes/demo";
import {
  createReport,
  getReports,
  updateReport,
  adminLogin,
  getReportStatus,
} from "./routes/reports";
import {
  streamNotifications,
  sendEmailNotification,
  sendSMSNotification,
  getNotificationSettings,
  testEmailService,
} from "./routes/notifications";

export function createServer() {
  const app = express();

  // Security middleware - must be first
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "blob:", "data:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "blob:", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "blob:", "data:"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false // Allow file uploads
  }));

  // CORS configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:8080'
  ];

  app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    maxAge: 86400 // 24 hours
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many requests from this IP, please try again later.'
    }
  });
  app.use(limiter);

  // Stricter rate limiting for sensitive endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Only 5 login attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many authentication attempts, please try again later.'
    }
  });

  // Body parsing middleware with size limits
  app.use(express.json({ limit: "10kb" })); // Reduced for security
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));

  // Cookie parser for secure sessions
  app.use(cookieParser());

  // Legacy routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Whistle server!" });
  });
  app.get("/api/demo", handleDemo);

  // Whistle API routes
  app.post("/api/reports", createReport);
  app.get("/api/reports", getReports);
  app.get("/api/reports/:id/status", getReportStatus); // Anonymous status check
  app.put("/api/reports/:id", updateReport);
  app.post("/api/admin/login", authLimiter, adminLogin);

  // Notification routes
  app.get("/api/notifications/stream", streamNotifications);
  app.post("/api/notifications/email", sendEmailNotification);
  app.post("/api/notifications/sms", sendSMSNotification);
  app.get("/api/notifications/settings", getNotificationSettings);
  app.post("/api/notifications/test-email", testEmailService);

  return app;
}
