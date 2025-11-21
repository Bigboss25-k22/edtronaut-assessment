import Joi from 'joi';

const createScoringJob = {
  body: Joi.object().keys({
    submission_id: Joi.string().uuid().required().messages({
      'any.required': 'submission_id is required',
      'string.uuid': 'submission_id must be a valid UUID',
    }),
  }),
};

const getJobStatus = {
  params: Joi.object().keys({
    id: Joi.string().uuid().required().messages({
      'string.guid': 'Job ID không hợp lệ'
    }),
  }),
};

export const ScoringValidation = {
  createScoringJob,
    getJobStatus,
};