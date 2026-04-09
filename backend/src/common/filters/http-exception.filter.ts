import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      response.status(status).json(exceptionResponse);
      return;
    }

    response.status(status).json({
      detail:
        exception instanceof HttpException
          ? exception.message
          : 'Error interno del servidor',
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
