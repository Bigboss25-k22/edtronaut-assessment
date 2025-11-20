import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { requestLogger } from '../utils/logger';

const app = express();

// Parse JSON first
app.use(express.json());
// Security + CORS
app.use(cors());
app.use(helmet());

// HTTP request logging: morgan for concise console output + our requestLogger for structured logging
app.use(morgan('dev'));
app.use(requestLogger);

export default app;