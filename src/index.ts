import dotenv from 'dotenv';
dotenv.config();

import app from './api';
import prisma from './db/prisma';
import config from './config';

const PORT = config.server.port;

let server: any;

// Kết nối DB trước rồi mới start server
prisma.$connect().then(() => {
  console.log('Connected to PostgreSQL');

  server = app.listen(PORT, () => {
    console.log(`API Server running on port ${PORT}`);
  });
}).catch((err: unknown) => {
  if (err instanceof Error) {
    console.error('Failed to connect to DB', err);
  } else {
    console.error('Failed to connect to DB', { error: String(err) });
  }
  process.exit(1);
});

// Xử lý Graceful Shutdown
const exitHandler = () => {
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

process.on('SIGTERM', exitHandler);
process.on('SIGINT', exitHandler);