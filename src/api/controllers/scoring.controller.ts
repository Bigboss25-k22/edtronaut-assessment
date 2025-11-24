import { Request, Response, NextFunction } from 'express';
import { ScoringService } from '../../services/scoring.service';
import {
    CreateScoringJobBody,
    CreateScoringJobResponse,
    GetScoringJobParams,
    GetScoringJobResponse,
} from '../../types';

// POST /v1/score-jobs
const createJob = async (
  req: Request<{}, CreateScoringJobResponse, CreateScoringJobBody>,
  res: Response<CreateScoringJobResponse>,
  next: NextFunction
) => {
  try {
    const { submission_id } = req.body;

    const job = await ScoringService.createScoringJob(submission_id);
    
    res.status(202).json({
      message: 'Scoring job created and queued successfully',
      job_id: job.id,
      status: job.status 
    });

  } catch (error) {
    next(error);
  }
};

export const getJob = async (
  req: Request<GetScoringJobParams, GetScoringJobResponse>,
  res: Response<GetScoringJobResponse>,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    
    const job = await ScoringService.getJobStatus(id);

    res.status(200).json({
      job_id: job.id,
      submission_id: job.submissionId,
      status: job.status, 
      score: job.score,     
      feedback: job.feedback,
      created_at: job.createdAt,
      completed_at: job.completedAt,
    });

  } catch (error) {
    next(error);
  }
};

export const ScoringController = {
  createJob,
  getJob,
};