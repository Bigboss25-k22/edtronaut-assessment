import winston from 'winston';
import config from '../config';

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.message, stack: info.stack });
  }
  return info;
});

const winstonLogger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    enumerateErrorFormat(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    
    config.server.env === 'development' ? winston.format.colorize() : winston.format.uncolorize(),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'async-scoring-service' },
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
      format: winston.format.combine(
        config.server.env === 'development' 
          ? winston.format.simple()
          : winston.format.json()
      ),
    }),
  ],
});

const logger = {
  info: (messsage: string, meta?: any) => winstonLogger.info(messsage, meta),
  warn: (messsage: string, meta?: any) => winstonLogger.warn(messsage, meta),
  error: (messsage: string, meta?: any) => winstonLogger.error(messsage, meta),
  debug: (messsage: string, meta?: any) => winstonLogger.debug(messsage, meta),
  logJobCreated: (jobId: string, submissionId: string) => {
    winstonLogger.info('Job created', {
      job_id: jobId,
      submission_id: submissionId,
      status: 'QUEUED',
      event: 'job.created',
    });
  },
  logJobStarted: (jobId: string) => {
    winstonLogger.info('Job started', {
      job_id: jobId,
      status: 'RUNNING',
      event: 'job.started',
    });
  },
  logJobCompleted: (jobId: string, durationMs?: number) => {
    winstonLogger.info('Job completed', {
      job_id: jobId,
      status: 'DONE',
      duration_ms: durationMs,
      event: 'job.completed',
    });
  },
  logJobFailed: (jobId: string, error: Error, attempt?: number) => {
    winstonLogger.error('Job failed', {
      job_id: jobId,
      status: 'ERROR',
      error: error.message,
      stack: error.stack,
      attempt: attempt,
      event: 'job.failed',
    });
  },
}

export default logger;