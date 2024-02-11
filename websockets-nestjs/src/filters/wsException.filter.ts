import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";

/*
BadRequestException is a child class of HttpException. Nest's default exception handler
for websockets checks to see if the caught exception is an instanceof WsException and if
not returns an unknown exception.
*/
// https://stackoverflow.com/questions/60749135/nestjs-validationpipe-in-websocketgateway-returns-internal-server-error
@Catch(WsException, HttpException)
export class WsExceptionFilter implements ExceptionFilter {
  catch(exception: WsException | HttpException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    let response;

    if (exception instanceof HttpException) {
      // Handle HTTP exceptions, including validation errors
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      response = {
        status: statusCode,
        error: exceptionResponse,
      };
    } else if (exception instanceof WsException) {
      // Handle WebSocket-specific exceptions
      response = { error: exception.getError() };
    } else {
      // Fallback for other types of exceptions
      response = { error: "Internal server error" };
    }

    // Emitting a custom error response to the client
    client.emit("exception", response);
  }
}
