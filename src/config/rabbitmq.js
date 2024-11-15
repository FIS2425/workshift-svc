import amqp from 'amqplib';

let channel;

export async function connectRabbitMQ() {
  if (!channel) {
    try {
      const connection = await amqp.connect(`amqp://${process.env.RABBIT_HOST || 'localhost'}`);
      channel = await connection.createChannel();
      console.log('[RabbitMQ] Connected and channel created');

      process.on('exit', () => {
        connection.close();
        console.log('[RabbitMQ] Connection closed');
      });

      // Handle connection errors
      connection.on('error', (err) => {
        console.error('[RabbitMQ] Connection error:', err);
        channel = null; // Reset channel so it will be recreated on the next request
      });

      connection.on('close', () => {
        console.log('[RabbitMQ] Connection closed');
        channel = null;
      });
    } catch (error) {
      console.error('[RabbitMQ] Failed to connect to RabbitMQ', error);
      throw error;
    }
  }
  return channel;
}