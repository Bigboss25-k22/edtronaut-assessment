import prisma from '../db/prisma';
import { queueClient } from '../queue/queue.client'; // Client xịn
import { HttpError } from '../utils/httpError';

const createScoringJob = async (submissionId: string) => {

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) {
    throw new HttpError(404, 'Submission not found');
  }

  if (submission.status !== 'SUBMITTED') {
    throw new HttpError(400, 'Cannot score a submission that is IN_PROGRESS. Please submit first.');
  }

  const existingJob = await prisma.scoringJob.findFirst({
    where: {
      submissionId,
      status: { in: ['QUEUED', 'RUNNING'] },
    },
  });

  if (existingJob) {
    return existingJob; 
  }

  const job = await prisma.scoringJob.create({
    data: {
      submissionId,
      status: 'QUEUED',
    },
  });

  await queueClient.addScoringJob(job.id, {
    scoringJobId: job.id,
    submissionId: submission.id,
    content: submission.content, 
  });

  return job;
};

const getJobStatus = async (jobId: string) => {
  const job = await prisma.scoringJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new HttpError(404, 'Scoring Job not found');
  }

  return job;
};

export const ScoringService = {
  createScoringJob,
  getJobStatus,
};