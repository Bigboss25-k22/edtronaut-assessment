const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'api', 'docs');

// Load các file nhỏ
const submissionSchemas = require(path.join(docsDir, 'schemas', 'submission.schema.json'));
const scoringSchemas = require(path.join(docsDir, 'schemas', 'scoring.schema.json'));
const commonSchemas = require(path.join(docsDir, 'schemas', 'common.schema.json'));

const submissionPaths = require(path.join(docsDir, 'paths', 'submissions.path.json'));
const scoringPaths = require(path.join(docsDir, 'paths', 'scoring.path.json'));

const commonResponses = require(path.join(docsDir, 'responses', 'common.response.json'));

// Merge thành OpenAPI spec hoàn chỉnh
const openApiSpec = {
    openapi: '3.0.3',
    info: {
        title: 'Edtronaut Assessment API',
        version: '1.0.0',
        description: 'Complete OpenAPI 3 specification for submission and scoring endpoints',
        contact: {
            name: 'API Support',
            email: 'support@edtronaut.com',
        },
    },
    servers: [
        {
            url: 'http://localhost:3000',
            description: 'Local development server',
        },
    ],
    tags: [
        { name: 'Submissions', description: 'Operations related to learner submissions' },
        { name: 'Scoring', description: 'Operations related to scoring jobs' },
    ],
    paths: {
        ...submissionPaths,
        ...scoringPaths,
    },
    components: {
        schemas: {
            ...submissionSchemas,
            ...scoringSchemas,
            ...commonSchemas,
        },
        responses: {
            ...commonResponses,
        },
    },
};

// Ghi ra file openapi.json
const outputPath = path.join(docsDir, 'openapi.json');
fs.writeFileSync(outputPath, JSON.stringify(openApiSpec, null, 2));

console.log('✅ OpenAPI spec generated successfully:', outputPath);
