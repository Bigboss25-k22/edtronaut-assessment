import Joi from 'joi';

const createSubmissionSchema = {
    body: Joi.object().keys({
        learnerId: Joi.string().uuid().required().messages({'any.required': 'learnerId is required', 'string.uuid': 'learnerId must be a valid UUID'}),
        simulationId: Joi.string().uuid().required().messages({'any.required': 'simulationId is required', 'string.uuid': 'simulationId must be a valid UUID'}),
    })
}

const updateSubmission = {
    params: Joi.object().keys({
        submissionId: Joi.string().uuid().required().messages({'any.required': 'submissionId is required', 'string.uuid': 'submissionId must be a valid UUID'}),
    }),
    body: Joi.object().keys({
        content: Joi.string().required().messages({'any.required': 'content is required', 'string.base': 'content must be a string'}),
    })
}

export const SubmissionValidation = {
    createSubmissionSchema,
    updateSubmission
}