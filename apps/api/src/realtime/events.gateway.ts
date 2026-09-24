import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  afterInit(server: Server) {
    this.logger.log('Real-time WebSocket/Socket.IO Gateway initialized on /events.');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:centre')
  handleJoinCentre(client: Socket, centreId: string) {
    if (centreId) {
      client.join(`centre:${centreId}`);
      this.logger.log(`Client ${client.id} joined centre room: centre:${centreId}`);
    }
  }

  @SubscribeMessage('join:farmer')
  handleJoinFarmer(client: Socket, farmerId: string) {
    if (farmerId) {
      client.join(`farmer:${farmerId}`);
      this.logger.log(`Client ${client.id} joined farmer room: farmer:${farmerId}`);
    }
  }

  emitToCentre(centreId: string, event: string, data: any) {
    if (this.server) {
      this.server.to(`centre:${centreId}`).emit(event, data);
    }
  }

  emitToFarmer(farmerId: string, event: string, data: any) {
    if (this.server) {
      this.server.to(`farmer:${farmerId}`).emit(event, data);
    }
  }

  emitToDepartment(centreId: string, department: string, event: string, data: any) {
    if (this.server) {
      this.server.to(`centre:${centreId}`).emit(`${department}:${event}`, data);
    }
  }

  isReady(): boolean {
    return !!this.server;
  }
}
