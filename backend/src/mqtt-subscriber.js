const mqtt = require('mqtt');
const { handleTelemetry, handleMqttMetric } = require('./api/telemetry');

const topic = process.env.MQTT_TOPIC || 'smartposture/telemetry';
const hierarchicalTopic = process.env.MQTT_TOPIC_HIERARCHY || 'racoon/+/+/+';
const debug = process.env.MQTT_DEBUG === '1';

function startMqttSubscriber(brokerUrl) {
  if (!brokerUrl) {
    console.log('[MQTT] No MQTT_BROKER set — telemetry only via POST /api/telemetry');
    return null;
  }
  const client = mqtt.connect(brokerUrl);
  client.on('connect', () => {
    client.subscribe([topic, hierarchicalTopic], (err) => {
      if (err) console.error('[MQTT] Subscribe error', err);
      else {
        console.log('[MQTT] Backend subscribed to', topic);
        console.log('[MQTT] Backend subscribed to', hierarchicalTopic);
      }
    });
  });
  client.on('message', async (t, payload) => {
    if (debug) console.log('[MQTT] Message received on', t);
    try {
      const handledAsMetric = await handleMqttMetric(t, payload.toString());
      if (!handledAsMetric) {
        await handleTelemetry(payload.toString());
      }
    } catch (e) {
      console.error('MQTT message error', e);
    }
  });
  client.on('error', (err) => console.error('[MQTT] Error', err));
  return client;
}

module.exports = { startMqttSubscriber };
