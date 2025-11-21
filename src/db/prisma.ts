import { PrismaClient } from '@prisma/client';
import config from '../config';

const prisma = new PrismaClient({
  log: config.server.env === 'development' ? ['error', 'warn'] : ['error'],
});

export default prisma;