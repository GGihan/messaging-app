import 'dotenv/config';
import express from 'express';
import { corsOptionsMiddleware } from './config/cors.js';
import configuredPassport from './config/passport.js';
import authRouter from './routes/authRouter.js';
import userRouter from './routes/userRouter.js';
import profileRouter from './routes/profileRouter.js';
import friendshipRouter from './routes/friendshipRouter.js';
import { sessionMiddleware } from './config/session.js';

const app = express();

// Trust the immediate frontmost proxy (e.g., Render built-in ingress router)
app.set('trust proxy', 1);

// CORS middleware
app.use(corsOptionsMiddleware);
// Middleware for form and JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session config
app.use(sessionMiddleware);

// Passport session initialization
// Initialize Passport helpers on req (req.login, req.logout)
app.use(configuredPassport.initialize());
// Read req.session.passport and run deserializeUser -> populates req.user
app.use(configuredPassport.session());

// Routers
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/profile', profileRouter);
app.use('/api/friendships', friendshipRouter)

// All none existing paths here
app.get('*path', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found.`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  // Development only
  console.error('Server Error:', err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred on the server.';
  res.status(statusCode).json({
    success: false,
    message: message,
  });
});

export default app;