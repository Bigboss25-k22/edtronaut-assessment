// src/db/prisma.ts
import { PrismaClient } from '@prisma/client';
import config from '../config';

const prisma = new PrismaClient({
  log: config.server.env === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;