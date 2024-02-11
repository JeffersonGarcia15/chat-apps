import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";

@Catch(WsException)
export class WsExceptionFilter implements ExceptionFilter {
  catch(exception: WsException, host: ArgumentsHost) {
    console.log("IN THE FILTER");
    const client = host.switchToWs().getClient<Socket>();
    const data = exception.getError();

    client.emit("exception", { error: data });
  }
}
