// Swagger configuration: expose the OpenAPI document and UI options
/* eslint-disable @typescript-eslint/no-var-requires */
const swaggerDocument = require('../api/docs/openapi.json');

export const swaggerOptions = {
  explorer: true,
};

export { swaggerDocument };

export default { swaggerDocument, swaggerOptions };
