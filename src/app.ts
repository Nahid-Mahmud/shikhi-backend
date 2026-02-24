import express, {
  type Application,
  type Request,
  type Response,
} from 'express';
import cors, { type CorsOptions } from 'cors';
import cookieParser from 'cookie-parser';
import expressSession from 'express-session';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { router } from './routes';
import notFound from './middlewares/notFound';
import globalErrorHandler from './middlewares/globalErrorHandler';
import envVariables from './config/env';

export const app: Application = express();
app.use(cookieParser());

// Set security HTTP headers
app.use(helmet());

const corsOptions: CorsOptions = {
  origin:
    envVariables.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : envVariables.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

app.use(express.json({ limit: '100mb' }));

app.use(
  expressSession({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(morgan('dev'));
app.set('trust proxy', 1);

// Rate Limiting

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    status: 429,
  },
});

app.use(globalLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'TalentPull API is running...',
    status: 'success',
    version: 'v1',
  });
});

app.get('/api/v1', (_req: Request, res: Response) => {
  res.json({
    message: 'You have reached the TalentPull API v1 endpoint',
    status: 'success',
  });
});

app.use('/api/v1', router);

app.use(globalErrorHandler);
app.use(notFound);
