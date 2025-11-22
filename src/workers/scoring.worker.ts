import { Worker, Job } from 'bullmq';
import prisma from '../db/prisma';
import config from '../config';
import logger from '../utils/logger';

import ScoringLogicService from '../services/scoring-logic.service'; 

const connection = {
    host: config.redis.host,
    port: config.redis.port,
}

const scoringWorker = new Worker(config.queue.name, async (job: Job) => {
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

        if (existingJob.status === 'DONE') {
            logger.info(`Job ${scoringJobId} already completed, skipping`);
            return { score: existingJob.score, feedback: existingJob.feedback };
        }

        if (existingJob.status === 'RUNNING') {
            logger.warn(`Job ${scoringJobId} is already running, potential duplicate`);
        }

        // Update status to RUNNING
        const startedAt = new Date();
        await prisma.scoringJob.update({
            where: { id: scoringJobId },
            data: { status: 'RUNNING', startedAt },
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        const result = ScoringLogicService.calculate(content);

        await prisma.scoringJob.update({
            where: { id: scoringJobId },
            data: {
                status: 'DONE',
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
                status: 'ERROR',
                feedback: `System Error: ${error.message}`,
                completedAt: new Date(),
            }
        });
        throw error;
    }
}, { 
    connection, 
    concurrency: 5 
});

// Event listeners cho worker
scoringWorker.on('completed', (job) => {
    logger.info(`Worker: Job ${job.id} completed successfully`);
});

scoringWorker.on('failed', (job, err) => {
    logger.error(`Worker: Job ${job?.id} failed with error: ${err.message}`);
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