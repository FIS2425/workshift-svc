import amqp from 'amqplib';

let channel;

export async function connectRabbitMQ() {
  if (!channel) {
    try {
      const connection = await amqp.connect(`amqp://${process.env.RABBIT_HOST || 'localhost'}`);
      channel = await connection.createChannel();
      console.log('[RabbitMQ] Connected and channel created');
      
      // Close connection when the process ends
      process.on('exit', () => {
        connection.close();
        console.log('[RabbitMQ] Connection closed');
      });
    } catch (error) {
      console.error('[RabbitMQ] Failed to connect to RabbitMQ', error);
      throw error;
    }
  }
  return channel;
}