import { NextFunction, Request, Response } from 'express';
import { SubmissionService } from '../../services/submission.service';

const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await SubmissionService.createSubmision(req.body);
        res.status(201).json({ 
            message: 'Submission created successfully',
            submission_id: result.id,
            status: result.status,
        });

    } catch (error) {
        next(error);
    }
}

const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { submissionId } = req.params;
    
    const result = await SubmissionService.updateSubmission(submissionId, req.body.content);
    
    res.status(200).json({
        message: 'Submission updated successfully',
        submission_id: result.id,
        status: result.status,
        updated_at: result.updatedAt
    });
  } catch (error) {
    next(error);
  }
};

export const SubmissionController = {
    create,
    update
};