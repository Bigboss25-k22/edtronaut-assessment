import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRouter from './routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument, swaggerOptions } from '../config/swagger';

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Mount API routes under /api
app.use('/api', apiRouter);

// Swagger UI (interactive API docs)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

export default app;