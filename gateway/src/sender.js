/**
 * Envoi des échantillons vers le backend : HTTP POST ou MQTT.
 */

const mqtt = require('mqtt');

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

function createMqttSender(brokerUrl, topic = 'smartposture/telemetry') {
  const client = mqtt.connect(brokerUrl);
  const debug = process.env.MQTT_DEBUG === '1';
  client.on('error', (err) => console.error('MQTT error:', err.message));
  client.on('connect', () => console.log('[MQTT] Gateway connected to broker, publishing to topic:', topic));
  return (sample) => {
    if (client.connected) {
      const payload = JSON.stringify(sample);
      client.publish(topic, payload);

      const deviceId = sample.deviceId || 'unknown';
      const postureTopic = `racoon/${deviceId}/sensors/posture`;
      const temperatureTopic = `racoon/${deviceId}/sensors/temperature`;
      const statusTopic = `racoon/${deviceId}/alerts/status`;

      if (sample.embeddedPosture != null) {
        client.publish(postureTopic, String(sample.embeddedPosture));
      }

      if (sample.temperatureC != null && Number.isFinite(Number(sample.temperatureC))) {
        client.publish(temperatureTopic, String(sample.temperatureC));
      }

      client.publish(statusTopic, String(sample.status || 'up'), { retain: true });

      if (debug) console.log('[MQTT] Published to', topic);
    }
  };
}

module.exports = { createHttpSender, createMqttSender };
