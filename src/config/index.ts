import 'dotenv/config';

const config = {
	server: {
		port: Number(process.env.PORT) || 3000,
		env: process.env.NODE_ENV || 'development',
	},

	database: {
		url: process.env.DATABASE_URL || '',
		host: process.env.DB_HOST || 'localhost',
		port: Number(process.env.DB_PORT) || 5432,
		user: process.env.DB_USER || 'postgres',
		password: process.env.DB_PASSWORD || 'password',
		database: process.env.DB_NAME || 'scoring_db',
	},

	redis: {
		host: process.env.REDIS_HOST || 'localhost',
		port: Number(process.env.REDIS_PORT) || 6379,
		url:
			process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
	},

	queue: {
		name: process.env.QUEUE_NAME || 'scoring-queue',
		maxAttempts: Number(process.env.QUEUE_MAX_ATTEMPTS) || 3,
		backoffDelay: Number(process.env.QUEUE_BACKOFF_DELAY) || 2000,
	},

	logging: {
		level: process.env.LOG_LEVEL || 'info',
	},

	scoring: {
		rubric: {
			code_quality: Number(process.env.SCORING_RUBRIC_CODE_QUALITY) || 0.3,
			correctness: Number(process.env.SCORING_RUBRIC_CORRECTNESS) || 0.4,
			documentation: Number(process.env.SCORING_RUBRIC_DOCUMENTATION) || 0.2,
			performance: Number(process.env.SCORING_RUBRIC_PERFORMANCE) || 0.1,
		},
	},
};

export default config;
