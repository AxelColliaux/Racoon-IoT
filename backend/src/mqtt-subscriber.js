const mqtt = require('mqtt');
const { handleTelemetry } = require('./api/telemetry');

const topic = process.env.MQTT_TOPIC || 'smartposture/telemetry';

function startMqttSubscriber(brokerUrl) {
  if (!brokerUrl) return null;
  const client = mqtt.connect(brokerUrl);
  client.on('connect', () => {
    client.subscribe(topic, (err) => {
      if (err) console.error('MQTT subscribe error', err);
      else console.log('MQTT subscribed to', topic);
    });
  });
  client.on('message', (t, payload) => {
    handleTelemetry(payload.toString()).catch((e) => {
      console.error('MQTT message error', e);
    });
  });
  client.on('error', (err) => console.error('MQTT error', err));
  return client;
}

module.exports = { startMqttSubscriber };
