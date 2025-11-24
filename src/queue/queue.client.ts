import { Queue, QueueEvents } from 'bullmq';
import config from '../config';
import logger from '../utils/logger';
import { ScoringJobData } from '../types';

class QueueClient {
  public queue: Queue<ScoringJobData>;
  private queueEvents: QueueEvents;

  constructor() {
    const connection = {
      host: config.redis.host,
      port: config.redis.port,
    };

    this.queue = new Queue<ScoringJobData>(config.queue.name, {
      connection,
      defaultJobOptions: {
        attempts: config.queue.maxAttempts,
        backoff: {
          type: 'exponential',
          delay: config.queue.backoffDelay,
        },
        removeOnComplete: true, 
        removeOnFail: false,    
      },
    });

    this.queueEvents = new QueueEvents(config.queue.name, { connection });

    this.setupEventListeners();
    
    logger.info(`Queue initialized: ${config.queue.name} connected to ${config.redis.host}:${config.redis.port}`);
  }

  private setupEventListeners() {
    this.queueEvents.on('error', (error) => {
        logger.error(`Queue connection error: ${error.message}`);
    });
  }

  /**
   * @param jobId - ID của Job (lấy từ Database)
   * @param data - Dữ liệu cần thiết để chấm (submissionId, content...)
   */
  async addScoringJob(jobId: string, data: ScoringJobData): Promise<void> {
    try {
      const job = await this.queue.add('score-submission', data, {
        jobId: jobId, 
      });

      logger.logJobCreated(jobId, data.submissionId);
      return job;
    } catch (error: any) {
      logger.error(`Failed to add job to queue`, { error: error.message });
      throw error;
    }
  }

  async getQueueStats() {
    return await this.queue.getJobCounts(
      'waiting', 
      'active', 
      'completed', 
      'failed', 
      'delayed'
    );
  }

  async close() {
    await this.queue.close();
    await this.queueEvents.close();
    logger.info('Queue closed successfully');
  }
}

export const queueClient = new QueueClient();