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

    this.isProducerConnected = false;

    this.initializeProducer();
  }

  async initializeProducer() {
    try {
      await this.producer.connect();
      this.isProducerConnected = true;
    } catch (error) {
      console.error('Error connecting Kafka producer:', error);
    }
  }

  async log(info, callback) {
    const message = {
      value: JSON.stringify({ ...info }),
    };
    const payloads = { topic: this.topic, messages: [message] };

    try {
      if (!this.isProducerConnected) {
        if (callback) callback();
        return;
      }
      await this.producer.send(payloads);

      if (callback) callback();
    } catch (error) {
      if (callback) callback(error);
    }
  }

  async close() {
    try {
      await this.producer.disconnect();
    } catch (error) {
      console.error('Error disconnecting Kafka producer:', error);
    }
  }
};

export default KafkaTransport;
