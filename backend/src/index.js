require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const http = require('node:http');
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const { connect } = require('./db');
const { registerRoutes, setBroadcast } = require('./api/telemetry');
const { registerVestRoutes } = require('./api/vests');
const { registerAuthRoutes } = require('./auth/routes');
const { authenticateToken } = require('./auth/middleware');
const { startMqttSubscriber } = require('./mqtt-subscriber');

const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const app = express();
app.use(cors());
app.use(express.json());

// Explicitly handle CORS preflight for all routes
app.options('*', cors());

// Public auth endpoints (login / register)
registerAuthRoutes(app);

// Protected API – require valid JWT for read endpoints
// POST /api/telemetry is left open for gateway ingestion (server-to-server)
app.get('/api/telemetry', authenticateToken);
app.get('/api/posture-events', authenticateToken);
app.use('/api/vests', authenticateToken);

registerRoutes(app);
registerVestRoutes(app);

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
