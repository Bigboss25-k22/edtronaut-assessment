import { Router } from 'express';
import { ScoringController }  from '../controllers/scoring.controller';

const router = Router();

router.post('/', ScoringController.createJob);
router.get('/:id', ScoringController.getJob);

export default router;
