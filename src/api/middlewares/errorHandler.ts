import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../utils/httpError';
import config from '../../config';

const errorConverter = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = err;

  if (!(error instanceof HttpError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new HttpError(statusCode, message, false, err.stack);
  }
  next(error);
};
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    let { statusCode, message } = err;

    if (config.server.env === 'production' && !err.isOperational) {
        statusCode = 500;
        message = 'Internal Server Error';
    }

    const response = {
        error: statusCode >= 500 ? 'Internal Server Error' : 'Bad Request',
        message,
        ...(config.server.env === 'development' && { stack: err.stack }),
    };

    if (config.server.env === 'development') {
        console.error(err);
    }
    
    res.status(statusCode).json(response);
};

export { errorConverter, errorHandler };