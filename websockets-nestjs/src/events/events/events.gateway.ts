import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server } from "socket.io";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage("events")
  findAll(@MessageBody() data: any) {
    // return from([1, 2, 3]).pipe(
    //   map((item) => ({ event: "events", data: item })),
    // );
    return { event: "events", data };
  }

  @SubscribeMessage("identity")
  async identity(@MessageBody() data: number): Promise<number> {
    return data;
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
