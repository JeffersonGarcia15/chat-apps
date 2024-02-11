import { UseFilters, UsePipes, ValidationPipe } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { WsExceptionFilter } from "src/filters/wsException.filter";
import { SendMessageDto } from "../dto/sendMessage.dto";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
@UseFilters(new WsExceptionFilter())
@UsePipes(new ValidationPipe())
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage("events")
  sendMessage(@MessageBody() data: SendMessageDto) {
    // return from([1, 2, 3]).pipe(
    //   map((item) => ({ event: "events", data: item })),
    // );
    console.log("AM I HERE", data);
    this.server
      .to(data.groupId)
      .emit("events", { groupId: data.groupId, message: data.message });
  }

  @SubscribeMessage("identity")
  async identity(@MessageBody() data: number): Promise<number> {
    return data;
  }

  // https://stackoverflow.com/questions/55949600/how-to-create-rooms-with-nestjs-and-socket-io
  @SubscribeMessage("joinGroup")
  joinGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    client.join(data.groupId);
    console.log(`User joined group ${data.groupId}`);
  }

  // Trying to create an "X is Typing..." feature
  @SubscribeMessage("startTyping")
  handleStartTyping(@MessageBody() data: { userId: string; groupId: string }) {
    // Broadcast to other clients in the group that userId is typing
    this.server
      .to(data.groupId)
      .emit("userTyping", { userId: data.userId, isTyping: true });
  }

  @SubscribeMessage("stopTyping")
  handleStopTyping(@MessageBody() data: { userId: string; groupId: string }) {
    // Broadcast to other clients in the group that userId has stopped typing
    this.server
      .to(data.groupId)
      .emit("userTyping", { userId: data.userId, isTyping: false });
  }
}
