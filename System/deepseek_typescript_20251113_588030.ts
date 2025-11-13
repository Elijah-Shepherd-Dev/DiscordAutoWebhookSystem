import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { authRouter } from './routes/auth';
import { webhookRouter } from './routes/webhooks';
import { scheduleRouter } from './routes/schedules';
import { templateRouter } from './routes/templates';
import { analyticsRouter } from './routes/analytics';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { connectDatabase } from './database';
import { initializeScheduler } from './scheduler';

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeDatabase();
    this.initializeScheduler();
  }

  private initializeMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors({
      origin: config.CORS_ORIGIN,
      credentials: true
    }));
    
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    });
    
    this.app.use(limiter);
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(requestLogger);
  }

  private initializeRoutes(): void {
    this.app.use('/api/auth', authRouter);
    this.app.use('/api/webhooks', webhookRouter);
    this.app.use('/api/schedules', scheduleRouter);
    this.app.use('/api/templates', templateRouter);
    this.app.use('/api/analytics', analyticsRouter);
    
    this.app.get('/health', (req, res) => {
      res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private async initializeDatabase(): Promise<void> {
    await connectDatabase();
  }

  private async initializeScheduler(): Promise<void> {
    await initializeScheduler();
  }

  public start(): void {
    this.app.listen(config.PORT, () => {
      console.log(`🚀 Server running on port ${config.PORT}`);
      console.log(`📊 Environment: ${config.NODE_ENV}`);
    });
  }
}

export default App;
