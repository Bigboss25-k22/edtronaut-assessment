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

        if (existingJob.status === ScoringJobStatus.DONE) {
            logger.info(`Job ${scoringJobId} already completed, skipping`);
            return { score: existingJob.score, feedback: existingJob.feedback };
        }

        if (existingJob.status === ScoringJobStatus.RUNNING) {
            logger.warn(`Job ${scoringJobId} is already running, potential duplicate`);
        }

        // Update status to RUNNING
        const startedAt = new Date();
        await prisma.scoringJob.update({
            where: { id: scoringJobId },
            data: { status: ScoringJobStatus.RUNNING, startedAt },
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

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

        await prisma.scoringJob.update({
            where: { id: scoringJobId },
            data: {
                status: ScoringJobStatus.ERROR,
                feedback: `System Error: ${error.message}`,
                completedAt: new Date(),
            }
        });
        throw error;
    }
}, { 
    connection, 
    concurrency: 5,
    lockDuration: 30000,     
    lockRenewTime: 15000,    
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