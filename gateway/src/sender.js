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
  client.on('error', (err) => console.error('MQTT error:', err.message));
  client.on('connect', () => console.log('MQTT connected'));
  return (sample) => {
    if (client.connected) client.publish(topic, JSON.stringify(sample));
  };
}

module.exports = { createHttpSender, createMqttSender };
