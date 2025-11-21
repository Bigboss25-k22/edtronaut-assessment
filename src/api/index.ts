import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRouter from './routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument, swaggerOptions } from '../config/swagger';
import { errorConverter, errorHandler } from './middlewares/errorHandler';

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

// Error handling middleware (phải đặt cuối cùng)
app.use(errorConverter);
app.use(errorHandler);

export default app;