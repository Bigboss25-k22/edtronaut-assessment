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
    const createdAt = new Date().toISOString();
    winstonLogger.info('Job created', {
      job_id: jobId,
      submission_id: submissionId,
      status: 'QUEUED',
      event: 'job.created',
      created_at: createdAt,
      // OpenTelemetry trace context (minimal)
      'trace.id': jobId,
      'span.kind': 'producer',
    });
  },
  
  logJobStarted: (jobId: string, createdAt?: Date) => {
    const startedAt = new Date().toISOString();
    const queuedDuration = createdAt ? Date.now() - createdAt.getTime() : undefined;
    
    winstonLogger.info('Job started', {
      job_id: jobId,
      status: 'RUNNING',
      event: 'job.started',
      started_at: startedAt,
      queued_duration_ms: queuedDuration,
      // OpenTelemetry trace context
      'trace.id': jobId,
      'span.kind': 'consumer',
    });
  },
  
  logJobCompleted: (jobId: string, startedAt?: Date, score?: number) => {
    const completedAt = new Date().toISOString();
    const processingDuration = startedAt ? Date.now() - startedAt.getTime() : undefined;
    
    winstonLogger.info('Job completed', {
      job_id: jobId,
      status: 'DONE',
      event: 'job.completed',
      completed_at: completedAt,
      processing_duration_ms: processingDuration,
      score: score,
      // OpenTelemetry trace context
      'trace.id': jobId,
      'span.kind': 'consumer',
    });
  },
  
  logJobFailed: (jobId: string, error: Error, attempt?: number, startedAt?: Date) => {
    const failedAt = new Date().toISOString();
    const processingDuration = startedAt ? Date.now() - startedAt.getTime() : undefined;
    
    winstonLogger.error('Job failed', {
      job_id: jobId,
      status: 'ERROR',
      error_message: error.message,
      stack: error.stack,
      attempt: attempt,
      event: 'job.failed',
      failed_at: failedAt,
      processing_duration_ms: processingDuration,
      // OpenTelemetry trace context
      'trace.id': jobId,
      'span.kind': 'consumer',
      'otel.status': 'error',
    });
  },
}

export default logger;