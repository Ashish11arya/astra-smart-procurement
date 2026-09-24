import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

import { execSync } from 'child_process';

async function bootstrap() {
  const logger = new Logger('AstraBootstrap');
  
  if (process.env.NODE_ENV === 'production') {
    try {
      logger.log('Running prisma db push...');
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      logger.log('Prisma db push successful.');
    } catch (error) {
      logger.error('Prisma db push failed:', error);
    }
  }

  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());

  // Set standard API route prefix
  app.setGlobalPrefix('api');

  // Configure CORS for web frontend
  const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.enableCors({
    origin: allowedOrigin.includes(',')
      ? allowedOrigin.split(',').map((o) => o.trim())
      : allowedOrigin,
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`=======================================================`);
  logger.log(` ASTRA Backend API initialized successfully`);
  logger.log(` URL: http://localhost:${port}/api`);
  logger.log(` Health Check: http://localhost:${port}/api/health`);
  logger.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`=======================================================`);
}

bootstrap();
