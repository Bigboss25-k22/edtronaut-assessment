import { Router } from 'express';
import submissionRouter from './submission.route';
import scoringRouter from './scoring.route';

const router = Router();

router.use('/submissions', submissionRouter);
router.use('/score-jobs', scoringRouter);

export default router;
