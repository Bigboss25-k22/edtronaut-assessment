import { Queue, QueueEvents } from 'bullmq';
import config from '../config';
import logger from '../utils/logger';

class QueueClient {
  public queue: Queue;
  private queueEvents: QueueEvents;

  constructor() {
    const connection = {
      host: config.redis.host,
      port: config.redis.port,
    };

    // 1. Khởi tạo Queue (Để đẩy job)
    this.queue = new Queue(config.queue.name, {
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

    // 2. Khởi tạo QueueEvents (Để lắng nghe sự kiện từ Redis)
    this.queueEvents = new QueueEvents(config.queue.name, { connection });

    this.setupEventListeners();
    
    logger.info(`Queue initialized: ${config.queue.name} connected to ${config.redis.host}:${config.redis.port}`);
  }

  private setupEventListeners() {
    // Job bắt đầu chạy (RUNNING)
    this.queueEvents.on('active', ({ jobId }) => {
      logger.logJobStarted(jobId); 
    });

    // Job hoàn thành (DONE)
    this.queueEvents.on('completed', ({ jobId, returnvalue }) => {
      logger.logJobCompleted(jobId, 0);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      const error = new Error(failedReason);
      logger.logJobFailed(jobId, error);
    });
    
    this.queueEvents.on('error', (error) => {
        logger.error(`Queue connection error: ${error.message}`);
    });
  }

  /**
   * @param jobId - ID của Job (lấy từ Database)
   * @param data - Dữ liệu cần thiết để chấm (submissionId, content...)
   */
  async addScoringJob(jobId: string, data: any) {
    try {
      const job = await this.queue.add('score-submission', data, {
        jobId: jobId, // QUAN TRỌNG: Idempotency (Dùng ID DB làm ID Queue)
      });

      // Log trạng thái QUEUED
      logger.logJobCreated(jobId, data.submissionId);
      return job;
    } catch (error: any) {
      logger.error(`Failed to add job to queue`, { error: error.message });
      throw error;
    }
  }

  /**
   * Lấy thống kê hàng đợi (Monitoring)
   */
  async getQueueStats() {
    return await this.queue.getJobCounts(
      'waiting', 
      'active', 
      'completed', 
      'failed', 
      'delayed'
    );
  }

  /**
   * Đóng kết nối (Graceful Shutdown)
   */
  async close() {
    await this.queue.close();
    await this.queueEvents.close();
    logger.info('Queue closed successfully');
  }
}

// Export Singleton Instance
export const queueClient = new QueueClient();