import { Router } from 'express';
import { SubmissionController } from '../controllers/submission.controller';

const router = Router();

router.post('/', SubmissionController.create);
router.patch('/:submissionId', SubmissionController.update);

export default router;
