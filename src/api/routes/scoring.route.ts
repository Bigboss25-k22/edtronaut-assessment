import { Router } from 'express';
import * as scoringController from '../controllers/scoring.controller';

const router = Router();

router.post('/', scoringController.createJob);
router.get('/:id', scoringController.getJob);

export default router;
