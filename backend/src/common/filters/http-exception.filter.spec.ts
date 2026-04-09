import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockGetResponse: jest.Mock;
  let mockGetRequest: jest.Mock;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
    mockGetRequest = jest.fn().mockReturnValue({ url: '/test' });
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: mockGetResponse,
        getRequest: mockGetRequest,
      }),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    };
  });

  it('handles HttpException with object response', () => {
    const exception = new HttpException(
      { message: 'Bad request', statusCode: 400 },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith({ message: 'Bad request', statusCode: 400 });
  });

  it('handles HttpException with string response', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: 'Forbidden',
        path: '/test',
      }),
    );
  });

  it('handles non-HttpException as 500 with default message', () => {
    const exception = new Error('unexpected');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: 'Error interno del servidor',
        path: '/test',
      }),
    );
  });

  it('includes timestamp in non-object response', () => {
    const exception = new Error('unexpected');

    filter.catch(exception, mockHost);

    const call = mockJson.mock.calls[0][0];
    expect(call.timestamp).toBeDefined();
    expect(typeof call.timestamp).toBe('string');
  });
});
