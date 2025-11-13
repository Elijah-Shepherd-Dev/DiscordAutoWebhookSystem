import { Server } from 'socket.io';
import { WebhookLog } from '../models/WebhookLog';

export class RealtimeService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.initializeSocketHandlers();
  }

  private initializeSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      socket.on('join_webhook_room', (webhookId: string) => {
        socket.join(`webhook_${webhookId}`);
        console.log(`User ${socket.id} joined webhook room: ${webhookId}`);
      });

      socket.on('leave_webhook_room', (webhookId: string) => {
        socket.leave(`webhook_${webhookId}`);
      });

      socket.on('send_test_webhook', async (data) => {
        try {
          // Handle test webhook in real-time
          const result = await this.handleTestWebhook(data);
          socket.emit('webhook_test_result', result);
        } catch (error) {
          socket.emit('webhook_test_error', { error: error.message });
        }
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
  }

  async broadcastWebhookExecution(webhookId: string, logData: any): Promise<void> {
    this.io.to(`webhook_${webhookId}`).emit('webhook_executed', {
      webhookId,
      ...logData,
      timestamp: new Date()
    });
  }

  async broadcastWebhookStatus(webhookId: string, status: any): Promise<void> {
    this.io.to(`webhook_${webhookId}`).emit('webhook_status_update', {
      webhookId,
      status,
      timestamp: new Date()
    });
  }

  private async handleTestWebhook(data: any): Promise<any> {
    // Implementation for real-time webhook testing
    return { success: true, message: 'Test webhook sent successfully' };
  }
}
