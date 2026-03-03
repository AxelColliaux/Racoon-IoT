/**
 * SmartPosture Gateway - Point d'entrée
 * Mode : mock | serial | tcp (Wokwi for VS Code RFC2217)
 * Envoi : API_URL (HTTP POST) ou MQTT_BROKER (MQTT)
 */

require('dotenv').config();
const { createSerialBridge, listPorts } = require('./serial-bridge');
const { runMockGenerator } = require('./mock-sensor');
const { createTcpBridge } = require('./tcp-bridge');
const { createHttpSender, createMqttSender } = require('./sender');

const mode = process.argv.find((a) => a.startsWith('--mode='))?.split('=')[1] || process.env.MODE || 'mock';
const apiUrl = process.env.API_URL || 'http://localhost:3000/api/telemetry';
const mqttBroker = process.env.MQTT_BROKER;
const serialPort = process.env.SERIAL_PORT;
const tcpHost = process.env.WOKWI_TCP_HOST || 'localhost';
const tcpPort = Number.parseInt(process.env.WOKWI_TCP_PORT || '4000', 10);
const intervalMs = Number.parseInt(process.env.INTERVAL_MS || '200', 10);

function getSender() {
  if (mqttBroker) return createMqttSender(mqttBroker);
  return createHttpSender(apiUrl);
}

const send = getSender();

function normalizeSample(data) {
  const deviceId = process.env.DEVICE_ID || data.id || 'gateway-1';
  const operatorId = process.env.OPERATOR_ID;
  const zone = process.env.ZONE;

  if (data.accel && data.gyro) {
    return {
      accel: data.accel,
      gyro: data.gyro,
      ts: data.ts ?? Date.now(),
      deviceId,
      operatorId,
      zone,
    };
  }
  
  // Format embarqué avec sensorHigh (haut du dos) et sensorLow (bas du dos)
  const high = data.sensorHigh && typeof data.sensorHigh === 'object' ? data.sensorHigh : null;
  const low = data.sensorLow && typeof data.sensorLow === 'object' ? data.sensorLow : null;

  if (high || low) {
    const h = high || { accX: 0, accY: 0, accZ: 9.81, gyrX: 0, gyrY: 0, gyrZ: 0 };
    const l = low || { accX: 0, accY: 0, accZ: 9.81, gyrX: 0, gyrY: 0, gyrZ: 0 };
    const ax = (h.accX ?? 0) + (l.accX ?? 0);
    const ay = (h.accY ?? 0) + (l.accY ?? 0);
    const az = (h.accZ ?? 0) + (l.accZ ?? 0);
    const gx = (h.gyrX ?? 0) + (l.gyrX ?? 0);
    const gy = (h.gyrY ?? 0) + (l.gyrY ?? 0);
    const gz = (h.gyrZ ?? 0) + (l.gyrZ ?? 0);
    const n = (high && low) ? 2 : 1;
    return {
      accel: {
        x: ax / n,
        y: ay / n,
        z: (az / n) || 9.81,
      },
      gyro: {
        x: gx / n,
        y: gy / n,
        z: gz / n,
      },
      ts: data.timestamp ?? Date.now(),
      deviceId,
      operatorId,
      zone,
      activity: data.activity,
      embeddedPosture: data.posture,
      angleDiff: data.angle_diff,
    };
  }

  // Format inconnu : on renvoie null pour ignorer l’échantillon
  return null;
}

function onSample(data) {
  const payload = normalizeSample(data);
  if (!payload) return;
  send(payload);
}

async function main() {
  if (mode === 'serial') {
    if (!serialPort) {
      const ports = await listPorts();
      console.error('SERIAL_PORT required. Available ports:', ports);
      process.exit(1);
    }
    createSerialBridge(serialPort, onSample, 115200);
    return;
  }

  if (mode === 'tcp') {
    console.log('Gateway: TCP mode — reading stream from Wokwi at', `${tcpHost}:${tcpPort}`);
    console.log('Gateway: Sending to backend via', mqttBroker ? 'MQTT (broker)' : 'HTTP POST');
    createTcpBridge(tcpHost, tcpPort, onSample);
    return;
  }

  // mock
  console.log('Gateway running in mock mode. Sending to', mqttBroker ? 'MQTT' : apiUrl);
  runMockGenerator(onSample, { intervalMs });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
