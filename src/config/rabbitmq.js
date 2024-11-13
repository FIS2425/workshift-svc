import amqp from 'amqplib';
import Workshift from '../schemas/Workshift.js';

let channel;

export async function connectRabbitMQ() {
  if (!channel) {
    try {
      const connection = await amqp.connect(`amqp://${process.env.RABBIT_HOST || 'localhost'}`);
      channel = await connection.createChannel();
      console.log('RabbitMQ connected and channel created');
      
      // Close connection when the process ends
      process.on('exit', () => {
        connection.close();
        console.log('RabbitMQ connection closed');
      });
    } catch (error) {
      console.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }
  return channel;
}

export async function syncWorkshiftsData(){
  const channel = await connectRabbitMQ();
  const queue = 'appointmentQueue';

  Workshift.find({})
    .then((data) => {
      const exchangeName = 'workshiftExchange';
      channel.assertExchange(exchangeName, 'fanout', { durable: false });
      channel.assertQueue(queue, { durable: false });
      channel.bindQueue(queue, exchangeName, '');
      data.forEach((workshift) => {
        const message= {
          event: 'workshift-sync',
          workshift: workshift,
        };
        channel.publish(exchangeName, '', Buffer.from(JSON.stringify(message)));
      });
      console.log(`${data.length} workshifts sent to RabbitMQ`);
    })
    .catch((err) => {
      console.error('Error fetching data from workshift:', err);
    });

}
