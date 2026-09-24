import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('AstraBootstrap');
  const app = await NestFactory.create(AppModule);

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
