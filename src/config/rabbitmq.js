import amqp from 'amqplib';
import Workshift from '../schemas/Workshift.js';

let channel;
const exchangeName = 'workshiftExchange';
const queueName = 'appointmentQueue';

export async function connectRabbitMQ() {
  if (!channel) {
    try {
      const connection = await amqp.connect(`amqp://${process.env.RABBIT_HOST || 'localhost'}`);
      channel = await connection.createChannel();
      console.log('[RabbitMQ] Connected and channel created');

      await setupRabbitMQ(channel);

      process.on('exit', () => {
        connection.close();
        console.log('[RabbitMQ] Connection closed');
      });

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

export async function publishWorkshiftSync(channel) {
  const workshifts = await Workshift.find();
  console.log(`[RabbitMQ] Publishing ${workshifts.length} workshifts`);
  channel.publish(exchangeName, 'workshift-sync', Buffer.from(JSON.stringify(workshifts)));
}

export async function publishWorkshiftCreated(workshift, channel) {
  channel.publish(exchangeName, 'workshift-created', Buffer.from(JSON.stringify(workshift)));
}

export async function publishWorkshiftUpdated(workshift, channel) {
  channel.publish(exchangeName, 'workshift-updated', Buffer.from(JSON.stringify(workshift)));
}

export async function publishWorkshiftDeleted(workshiftId, channel) {
  channel.publish(exchangeName, 'workshift-deleted', Buffer.from(JSON.stringify({ _id: workshiftId })));
}

export async function publishWorkshiftsMany(workshifts, channel) {
  channel.publish(exchangeName, 'workshifts-many', Buffer.from(JSON.stringify(workshifts)));
}


async function setupRabbitMQ(channel) {
  try {
    await channel.deleteExchange(exchangeName);
  } catch (error) {
    console.log(`[RabbitMQ] Exchange ${exchangeName} does not exist, creating a new one.`);
    console.log(error);
  }
  await channel.assertExchange(exchangeName, 'fanout', { durable: true });
  try {
    await channel.deleteQueue(queueName);
  } catch (error) {
    console.log(`[RabbitMQ] Queue ${queueName} does not exist, creating a new one.`);
    console.log(error);
  }
  await channel.assertQueue(queueName, { durable: true });
  await channel.bindQueue(queueName, 'workshiftExchange', '');
  console.log('[RabbitMQ] Setup completed');
}
