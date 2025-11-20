import { Request, Response, NextFunction} from 'express';
import Joi from 'joi';
import { HttpError } from '../../utils/httpError';
import { pick } from '../../utils/pick';

interface ValidationSchema {
    body?: Joi.Schema;
    query?: Joi.Schema;
    params?: Joi.Schema;
}

const validate = (schema: ValidationSchema) => (req: Request, res: Response, next: NextFunction) => {
    const validSchema = pick(schema, ['body', 'query', 'params']);
    const object = pick(req, Object.keys(validSchema));

    const { value, error } = Joi.compile(validSchema)
        .prefs({ errors: { label: 'key' }, abortEarly: false })
        .validate(object);

    if (error) {
        const errorMessage = error.details.map((details) => details.message).join(', ');
        next(new HttpError(400, `Validation error: ${errorMessage}`));
    }

    Object.assign(req, value);
    return next();
}

export default validate;

