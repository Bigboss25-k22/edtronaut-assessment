import { Router } from 'express';
import { SubmissionController } from '../controllers/submission.controller';
import validate from '../middlewares/validate';
import { SubmissionValidation } from '../validations/submission.validation';

const router = Router();

router.post('/', validate(SubmissionValidation.createSubmissionSchema), SubmissionController.create);
router.patch('/:submissionId', validate(SubmissionValidation.updateSubmission), SubmissionController.update);
router.post('/:submissionId/submit', validate(SubmissionValidation.submitSubmission), SubmissionController.submit);

export default router;
