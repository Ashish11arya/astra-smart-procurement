import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Unknown error';
    let error = 'Error';
    let stack: string | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const extRes = exception.getResponse();
      if (typeof extRes === 'object' && extRes !== null) {
        message = (extRes as any).message || exception.message;
        error = (extRes as any).error || exception.name;
      } else {
        message = extRes || exception.message;
        error = exception.name;
      }
      stack = exception.stack;
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
      stack = exception.stack;
    } else if (typeof exception === 'string') {
      message = exception;
    } else if (typeof exception === 'object' && exception !== null) {
      message = (exception as any).message || 'Unknown error';
      error = (exception as any).name || 'Error';
    }

    // Ensure headers aren't already sent to avoid crashing the server
    if (!response.headersSent) {
      response.status(status).json({
        statusCode: status,
        message,
        error,
        stack,
      });
    }
  }
}
