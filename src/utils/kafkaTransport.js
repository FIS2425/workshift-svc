import winston from 'winston';
import { Kafka } from 'kafkajs';

class KafkaTransport extends winston.Transport {
  constructor(opts) {
    super(opts);

    this.client = new Kafka({
      clientId: 'auth',
      brokers: [process.env.KAFKA_HOST]
    });
    this.producer = this.client.producer();

    this.topic = opts.topic || 'logs';
  }

  async log(info, callback) {
    const message = {
      value: JSON.stringify({ ...info })
    };

    const payloads = { topic: this.topic, messages: [message] };

    // Send the log to Kafka
    try {
      await this.producer.connect();
      await this.producer.send(payloads);
      await this.producer.disconnect();
    } catch (error) {
      callback(error, false);
    }
  }
};

export default KafkaTransport;
