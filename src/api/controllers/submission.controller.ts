import { NextFunction, Request, Response } from 'express';
import { SubmissionService } from '../../services/submission.service';
import {
    CreateSubmissionBody,
    CreateSubmissionResponse,
    UpdateSubmissionParams,
    UpdateSubmissionBody,
    UpdateSubmissionResponse,
    SubmitSubmissionParams,
    SubmitSubmissionResponse,
} from '../../types';

const create = async (
    req: Request<{}, CreateSubmissionResponse, CreateSubmissionBody>,
    res: Response<CreateSubmissionResponse>,
    next: NextFunction
) => {
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

const update = async (
    req: Request<UpdateSubmissionParams, UpdateSubmissionResponse, UpdateSubmissionBody>,
    res: Response<UpdateSubmissionResponse>,
    next: NextFunction
) => {
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

const submit = async (
    req: Request<SubmitSubmissionParams, SubmitSubmissionResponse>,
    res: Response<SubmitSubmissionResponse>,
    next: NextFunction
) => {
    try {
      const { submissionId } = req.params;
      const result = await SubmissionService.submitSubmission(submissionId);

      return res.status(200).json({
        message: 'Submission submitted successfully',
        submission_id: result.id,
        status: result.status,
      });
    } catch (error) {
      next(error);
    }
}

export const SubmissionController = {
    create,
    update,
    submit
};