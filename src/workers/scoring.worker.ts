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

    logger.logJobStarted(scoringJobId);
    try {
        await prisma.scoringJob.update({
            where: { id: scoringJobId },
            data: { status: 'RUNNING', startedAt: new Date() },
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

        logger.logJobCompleted(scoringJobId);

        return result;

    } catch (error: any) {
        logger.logJobFailed(scoringJobId, error as Error, job.attemptsMade);

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