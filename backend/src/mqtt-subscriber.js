const mqtt = require('mqtt');
const { handleTelemetry } = require('./api/telemetry');

const topic = process.env.MQTT_TOPIC || 'smartposture/telemetry';
const debug = process.env.MQTT_DEBUG === '1';

function startMqttSubscriber(brokerUrl) {
  if (!brokerUrl) {
    console.log('[MQTT] No MQTT_BROKER set — telemetry only via POST /api/telemetry');
    return null;
  }
  const client = mqtt.connect(brokerUrl);
  client.on('connect', () => {
    client.subscribe(topic, (err) => {
      if (err) console.error('[MQTT] Subscribe error', err);
      else console.log('[MQTT] Backend subscribed to', topic, '— receiving telemetry from broker only (no TCP to gateway)');
    });
  });
  client.on('message', (t, payload) => {
    if (debug) console.log('[MQTT] Message received on', t);
    handleTelemetry(payload.toString()).catch((e) => {
      console.error('MQTT message error', e);
    });
  });
  client.on('error', (err) => console.error('[MQTT] Error', err));
  return client;
}

module.exports = { startMqttSubscriber };
