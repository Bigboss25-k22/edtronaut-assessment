import { Worker, Job } from 'bullmq';
import prisma from '../db/prisma';
import config from '../config';
import logger from '../utils/logger';
import ScoringLogicService from '../services/scoring-logic.service';
import { ScoringJobData, ScoringJobStatus, SubmissionContent } from '../types';

const connection = {
    host: config.redis.host,
    port: config.redis.port,
}

const scoringWorker = new Worker<ScoringJobData>(config.queue.name, async (job: Job<ScoringJobData>) => {
    const { scoringJobId, submissionId, content } = job.data;
    
    try {
        const existingJob = await prisma.scoringJob.findUnique({
            where: { id: scoringJobId },
        });

        if (!existingJob) {
            throw new Error(`Scoring job ${scoringJobId} not found in database`);
        }

        // Log job started với created timestamp để tính queued duration
        logger.logJobStarted(scoringJobId, existingJob.createdAt);

        // Idempotency: Skip if already DONE
        if (existingJob.status === ScoringJobStatus.DONE) {
            logger.info(`Job ${scoringJobId} already completed, skipping`);
            return { score: existingJob.score, feedback: existingJob.feedback };
        }

        // Idempotency: Skip if already RUNNING (another worker processing)
        if (existingJob.status === ScoringJobStatus.RUNNING) {
            logger.warn(`Job ${scoringJobId} is already running by another worker, skipping`);
            return;
        }

        // Skip if not QUEUED (e.g., ERROR state before final retry)
        if (existingJob.status !== ScoringJobStatus.QUEUED) {
            logger.info(`Job ${scoringJobId} is not in QUEUED state (${existingJob.status}), skipping`);
            return;
        }

        // Atomic update: Only update if still QUEUED (prevent race condition)
        const startedAt = new Date();
        const updated = await prisma.scoringJob.updateMany({
            where: { 
                id: scoringJobId,
                status: ScoringJobStatus.QUEUED  // Conditional update
            },
            data: { 
                status: ScoringJobStatus.RUNNING, 
                startedAt 
            },
        });

        // If update failed, another worker already picked it up
        if (updated.count === 0) {
            logger.warn(`Job ${scoringJobId} was picked up by another worker, skipping`);
            return;
        }

        // Mock processing delay (remove in production)
        if (process.env.NODE_ENV === 'development') {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const result = ScoringLogicService.calculate(content as SubmissionContent);

        await prisma.scoringJob.update({
            where: { id: scoringJobId },
            data: {
                status: ScoringJobStatus.DONE,
                score: result.score,
                feedback: result.feedback,
                completedAt: new Date(),
            }
        });

        // Log completed với started timestamp để tính processing duration
        logger.logJobCompleted(scoringJobId, startedAt, result.score);

        return result;

    } catch (error: any) {
        // Get startedAt from DB nếu có để tính duration
        const jobData = await prisma.scoringJob.findUnique({
            where: { id: scoringJobId },
            select: { startedAt: true }
        });
        
        logger.logJobFailed(
            scoringJobId, 
            error as Error, 
            job.attemptsMade,
            jobData?.startedAt || undefined
        );

        // Only mark as ERROR if final attempt (after 3 retries)
        if (job.attemptsMade >= 3) {
            await prisma.scoringJob.update({
                where: { id: scoringJobId },
                data: {
                    status: ScoringJobStatus.ERROR,
                    feedback: `Failed after ${job.attemptsMade} attempts: ${error.message}`,
                    completedAt: new Date(),
                }
            });
        } else {
            // Reset to QUEUED for retry
            await prisma.scoringJob.update({
                where: { id: scoringJobId },
                data: { status: ScoringJobStatus.QUEUED }
            });
        }
        
        throw error;  // Let BullMQ handle retry
    }
}, { 
    connection, 
    concurrency: 5,
    lockDuration: 60000,     // 60s (tăng để an toàn hơn)
    lockRenewTime: 30000,    // 30s (renew ở giữa)
});

// Event listeners cho worker
scoringWorker.on('completed', (job) => {
    logger.info(`Worker: Job ${job.id} completed successfully`);
});

scoringWorker.on('failed', async (job, err) => {
    logger.error(`Worker: Job ${job?.id} failed with error: ${err.message}`);
    
    if (job && job.attemptsMade >= 3) {
        logger.error(`Job ${job.id} moved to DLQ after ${job.attemptsMade} attempts`, {
            submissionId: job.data.submissionId,
            error: err.message,
            failedAt: new Date().toISOString()
        });
        
        // TODO: Send alert (Slack, Email, PagerDuty)
        // await sendAlert(`CRITICAL: Scoring job ${job.id} failed permanently`);
    }
});

scoringWorker.on('error', (err) => {
    logger.error(`Worker error: ${err.message}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, closing worker...');
    await scoringWorker.close();
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, closing worker...');
    await scoringWorker.close();
    await prisma.$disconnect();
    process.exit(0);
});

logger.info(`Scoring Worker started, listening to queue: ${config.queue.name}`);

export default scoringWorker;