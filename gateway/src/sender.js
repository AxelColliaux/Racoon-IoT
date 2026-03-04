/**
 * Envoi des échantillons vers le backend : HTTP POST ou MQTT.
 * MQTT : 3 topics hiérarchisés sensors/alerts/posture, sensors/alerts/temperature, sensors/config/status
 */

const mqtt = require('mqtt');

const TOPIC_POSTURE = 'sensors/alerts/posture';
const TOPIC_TEMPERATURE = 'sensors/alerts/temperature';
const TOPIC_STATUS = 'sensors/config/status';

function createHttpSender(apiUrl) {
  let lastLog = 0;
  const LOG_INTERVAL_MS = 5000;
  return async (sample) => {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sample),
      });
      if (!res.ok) console.error('HTTP', res.status, await res.text());
    } catch (err) {
      const now = Date.now();
      if (now - lastLog >= LOG_INTERVAL_MS) {
        lastLog = now;
        console.error(
          'HTTP send error: backend unreachable at',
          apiUrl,
          '—',
          err.cause?.code || err.message,
          '(backend running? npm start in backend/)'
        );
      }
    }
  };
}

function createMqttSender(brokerUrl) {
  const client = mqtt.connect(brokerUrl);
  const debug = process.env.MQTT_DEBUG === '1';
  client.on('error', (err) => console.error('MQTT error:', err.message));
  client.on('connect', () => {
    console.log('[MQTT] Gateway connected — topics:', TOPIC_POSTURE, TOPIC_TEMPERATURE, TOPIC_STATUS);
  });
  return (sample) => {
    if (!client.connected) return;
    const ts = sample.ts ?? Date.now();
    const deviceId = sample.deviceId ?? 'unknown';
    const operatorId = sample.operatorId ?? null;
    const zone = sample.zone ?? null;

    // sensors/alerts/posture — posture + mouvements
    const posturePayload = {
      deviceId,
      operatorId,
      zone,
      ts,
      accel: sample.accel,
      gyro: sample.gyro,
      activity: sample.activity,
      embeddedPosture: sample.embeddedPosture,
      angleDiff: sample.angleDiff,
    };
    client.publish(TOPIC_POSTURE, JSON.stringify(posturePayload));
    if (debug) console.log('[MQTT] Published to', TOPIC_POSTURE);

    // sensors/alerts/temperature
    if (sample.temperature != null) {
      client.publish(TOPIC_TEMPERATURE, JSON.stringify({
        deviceId,
        operatorId,
        zone,
        ts,
        temperature: sample.temperature,
      }));
      if (debug) console.log('[MQTT] Published to', TOPIC_TEMPERATURE);
    }

    // sensors/config/status — statut (up)
    client.publish(TOPIC_STATUS, JSON.stringify({
      deviceId,
      ts,
      status: sample.status ?? 'up',
    }));
    if (debug) console.log('[MQTT] Published to', TOPIC_STATUS);
  };
}

module.exports = { createHttpSender, createMqttSender, TOPIC_POSTURE, TOPIC_TEMPERATURE, TOPIC_STATUS };
