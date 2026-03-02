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

function onSample(data) {
  const payload = {
    accel: data.accel,
    gyro: data.gyro,
    ts: data.ts ?? Date.now(),
    deviceId: process.env.DEVICE_ID || 'gateway-1',
    operatorId: process.env.OPERATOR_ID,
    zone: process.env.ZONE,
  };
  send(payload);
}

async function main() {
  if (mode === 'serial') {
    if (!serialPort) {
      const ports = await listPorts();
      console.error('SERIAL_PORT required. Available ports:', ports);
      process.exit(1);
    }
    createSerialBridge(serialPort, 115200, onSample);
    return;
  }

  if (mode === 'tcp') {
    console.log('Gateway running in TCP mode. Connecting to', `${tcpHost}:${tcpPort}`);
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
