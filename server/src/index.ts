import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './swagger';

// Route imports
import authRoutes from './routes/auth.routes';
import bookRoutes from './routes/book.routes';
import borrowRoutes from './routes/borrow.routes';
import fineRoutes from './routes/fine.routes';
import reservationRoutes from './routes/reservation.routes';
import dashboardRoutes from './routes/dashboard.routes';
import userRoutes from './routes/user.routes';

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
const allowedOrigins = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/api/docs.json', (_req: Request, res: Response) => {
  res.json(swaggerDocument);
});

// Create modular API router that handles all API endpoints
const apiRouter = express.Router();

apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'LibraryHub API',
    database: 'Neon PostgreSQL (Connected)',
  });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/books', bookRoutes);
apiRouter.use('/borrow', borrowRoutes);
apiRouter.use('/fines', fineRoutes);
apiRouter.use('/reservations', reservationRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/users', userRoutes);

// Mount router on both '/api' and '/' to ensure 100% compatibility with Vercel rewrites
app.use('/api', apiRouter);
app.use(apiRouter);

// Serve client static build in production if available
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ success: false, message: 'API endpoint not found' });
    return;
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      next();
    }
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 LibraryHub API server running on http://localhost:${PORT}`);
    console.log(`📚 Interactive Swagger API Docs available at http://localhost:${PORT}/api/docs`);
  });
}

export default app;
