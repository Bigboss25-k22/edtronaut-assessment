import prisma from '../db/prisma';
import { Prisma } from '@prisma/client';
import { queueClient } from '../queue/queue.client';
import { HttpError } from '../utils/httpError';
import {
    SubmissionStatus,
    ScoringJobStatus,
    ScoringJobCreateResult,
    ScoringJobStatusResult,
    SubmissionContent,
} from '../types';

const createScoringJob = async (submissionId: string): Promise<ScoringJobCreateResult> => {
  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) {
    throw new HttpError(404, 'Submission not found');
  }

  if (submission.status !== SubmissionStatus.SUBMITTED) {
    throw new HttpError(400, 'Cannot score a submission that is IN_PROGRESS. Please submit first.');
  }

  const existingJob = await prisma.scoringJob.findFirst({
    where: {
      submissionId,
      status: { in: [ScoringJobStatus.QUEUED, ScoringJobStatus.RUNNING] },
    },
  });

  if (existingJob) {
    return existingJob;
  }

  const job = await prisma.scoringJob.create({
    data: {
      submissionId,
      status: ScoringJobStatus.QUEUED,
    },
  });

  await queueClient.addScoringJob(job.id, {
    scoringJobId: job.id,
    submissionId: submission.id,
    content: submission.content as unknown as SubmissionContent,
  });

  return job;
};

const getJobStatus = async (jobId: string): Promise<ScoringJobStatusResult> => {
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