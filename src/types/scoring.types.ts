import { ScoringJob } from '@prisma/client';

// ================== ENUMS ==================
export enum ScoringJobStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  DONE = 'DONE',
  ERROR = 'ERROR',
}

// ================== DOMAIN MODELS ==================
export interface ScoringResult {
  score: number;
  feedback: string;
}

export interface ScoringJobData {
  scoringJobId: string;
  submissionId: string;
  content: unknown; // Prisma JsonValue - will be cast to SubmissionContent in worker
}

// ================== REQUEST TYPES ==================
export interface CreateScoringJobBody {
  submission_id: string;
}

export interface GetScoringJobParams {
  id: string;
}

// ================== RESPONSE TYPES ==================
export interface CreateScoringJobResponse {
  message: string;
  job_id: string;
  status: string;
}

export interface GetScoringJobResponse {
  job_id: string;
  submission_id: string;
  status: string;
  score: number | null;
  feedback: string | null;
  created_at: Date;
  completed_at: Date | null;
}

// ================== SERVICE RETURN TYPES ==================
export type ScoringJobCreateResult = ScoringJob;

export type ScoringJobStatusResult = ScoringJob;
