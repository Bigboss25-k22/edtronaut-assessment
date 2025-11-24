import { Router } from 'express';
import { ScoringController }  from '../controllers/scoring.controller';
import validate from '../middlewares/validate';
import { ScoringValidation } from '../validations/scoring.validation';

const router = Router();

router.post('/', validate(ScoringValidation.createScoringJob), ScoringController.createJob);
router.get('/:id', validate(ScoringValidation.getJobStatus), ScoringController.getJob);

export default router;
