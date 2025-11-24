import { Submission } from '@prisma/client';

// ================== ENUMS ==================
export enum SubmissionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
}

// ================== DOMAIN MODELS ==================
export interface SubmissionContent {
  source_code: string;
  documentation: string;
}

// ================== REQUEST TYPES ==================
export interface CreateSubmissionBody {
  learnerId: string;
  simulationId: string;
}

export interface UpdateSubmissionParams {
  submissionId: string;
}

export interface UpdateSubmissionBody {
  content: {
    source_code?: string;
    documentation?: string;
  };
}

export interface SubmitSubmissionParams {
  submissionId: string;
}

// ================== RESPONSE TYPES ==================
export interface CreateSubmissionResponse {
  message: string;
  submission_id: string;
  status: string;
}

export interface UpdateSubmissionResponse {
  message: string;
  submission_id: string;
  status: string;
  updated_at: Date;
}

export interface SubmitSubmissionResponse {
  message: string;
  submission_id: string;
  status: string;
}

// ================== SERVICE RETURN TYPES ==================
export type SubmissionCreateResult = Submission;

export type SubmissionUpdateResult = Submission;

export type SubmissionSubmitResult = Pick<Submission, 'id' | 'status'>;
