import { Request, Response, NextFunction } from 'express';
import { ScoringService } from '../../services/scoring.service';

// POST /v1/score-jobs
const createJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { submission_id } = req.body;

    const job = await ScoringService.createScoringJob(submission_id);
    
    res.status(202).json({
      job_id: job.id,
      status: job.status 
    });

  } catch (error) {
    next(error);
  }
};

export const getJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const job = await ScoringService.getJobStatus(id);

    res.status(200).json({
      job_id: job.id,
      status: job.status, 
      score: job.score,     
      feedback: job.feedback 
    });

  } catch (error) {
    next(error);
  }
};

export const ScoringController = {
  createJob,
  getJob,
};