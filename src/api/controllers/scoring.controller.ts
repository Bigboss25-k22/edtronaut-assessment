import { Request, Response, NextFunction } from 'express';

export const createJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json({ message: 'Scoring job queued' });
  } catch (err) {
    next(err);
  }
};

export const getJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ status: 'queued' });
  } catch (err) {
    next(err);
  }
};

export default { createJob, getJob };
