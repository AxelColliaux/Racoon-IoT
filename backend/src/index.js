require('dotenv').config();
const http = require('node:http');
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const { connect } = require('./db');
const { registerRoutes, setBroadcast } = require('./api/telemetry');
const { startMqttSubscriber } = require('./mqtt-subscriber');

const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const app = express();
app.use(cors());
app.use(express.json());

registerRoutes(app);

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
  ws.on('error', () => clients.delete(ws));
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  clients.forEach((c) => {
    if (c.readyState === 1) c.send(msg);
  });
}

setBroadcast(broadcast);

startMqttSubscriber(process.env.MQTT_BROKER);

async function start() {
  await connect();
  server.listen(PORT, () => {
    console.log('SmartPosture backend listening on', PORT, '| WebSocket /ws');
  });
}

start().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exitCode = 1;
});
