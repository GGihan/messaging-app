import cors from 'cors';
import { isProduction } from './env.js';

const allowedOrigins = [
  process.env.FRONTEND_URL,
].filter(Boolean);

// Add local origins ONLY when not in production
if (!isProduction) {
  allowedOrigins.push(
    'http://localhost:5174',
    'http://localhost:5173',
    'http://localhost:4173',
    'https://web.firecamp.io',
    'https://firecamp.io'
  );
}

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl requests, or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true, // Required to send HttpOnly cookies or authorization headers
  optionsSuccessStatus: 200,
};

export const corsOptionsMiddleware = cors(corsOptions);