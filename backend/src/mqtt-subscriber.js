const mqtt = require('mqtt');
const { handlePostureMessage } = require('./api/telemetry');
const { handleTemperatureMessage, handleStatusMessage } = require('./api/sensor-timeseries');

const TOPIC_POSTURE = 'sensors/alerts/posture';
const TOPIC_TEMPERATURE = 'sensors/alerts/temperature';
const TOPIC_STATUS = 'sensors/config/status';
const TOPICS = [TOPIC_POSTURE, TOPIC_TEMPERATURE, TOPIC_STATUS];
const debug = process.env.MQTT_DEBUG === '1';

function startMqttSubscriber(brokerUrl) {
  if (!brokerUrl) {
    console.log('[MQTT] No MQTT_BROKER set — telemetry only via POST /api/telemetry');
    return null;
  }
  const client = mqtt.connect(brokerUrl);
  client.on('connect', () => {
    client.subscribe(TOPICS, (err) => {
      if (err) console.error('[MQTT] Subscribe error', err);
      else console.log('[MQTT] Backend subscribed to', TOPICS.join(', '));
    });
  });
  client.on('message', (topic, payload) => {
    if (debug) console.log('[MQTT] Message received on', topic);
    const payloadStr = payload.toString();
    let p;
    if (topic === TOPIC_POSTURE) {
      p = handlePostureMessage(payloadStr);
    } else if (topic === TOPIC_TEMPERATURE) {
      p = handleTemperatureMessage(payloadStr);
    } else if (topic === TOPIC_STATUS) {
      p = handleStatusMessage(payloadStr);
    } else {
      return;
    }
    p.catch((e) => console.error('MQTT message error', e));
  });
  client.on('error', (err) => console.error('[MQTT] Error', err));
  return client;
}

module.exports = { startMqttSubscriber, TOPIC_POSTURE, TOPIC_TEMPERATURE, TOPIC_STATUS };
