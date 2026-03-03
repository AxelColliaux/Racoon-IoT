const { insertTelemetry, insertPostureEvent, getRecentTelemetry, getRecentPostureEvents } = require('../db');
const { detect } = require('../posture/detector');

let broadcastPosture = () => {};

function setBroadcast(fn) {
  broadcastPosture = fn;
}

async function handleTelemetry(payload) {
  const body = typeof payload === 'string' ? JSON.parse(payload) : payload;
  const deviceId = body.deviceId ?? 'unknown';
  const operatorId = body.operatorId ?? null;
  const zone = body.zone ?? null;
  const ts = body.ts ?? Date.now();
  const accel = body.accel || {};
  const gyro = body.gyro || {};
  const activity = body.activity ?? null;
  const embeddedPosture = body.embeddedPosture ?? null;
  const angleDiff = body.angleDiff ?? null;

  const row = {
    deviceId,
    operatorId,
    zone,
    accel: { x: accel.x ?? 0, y: accel.y ?? 0, z: accel.z ?? 1 },
    gyro: { x: gyro.x ?? 0, y: gyro.y ?? 0, z: gyro.z ?? 0 },
    ts,
    activity,
    embeddedPosture,
    angleDiff,
  };

  // Persistance : chaque position (télémétrie) est enregistrée en base
  await insertTelemetry(row);

  const result = detect(row);
  const message = {
    type: 'posture',
    deviceId,
    operatorId,
    zone,
    activity,
    embeddedPosture,
    angleDiff,
    ...result,
  };
  broadcastPosture(message);

  if (result.shouldEmitAlert) {
    // Persistance : chaque alerte posture est enregistrée en base
    await insertPostureEvent({
      deviceId,
      operatorId,
      zone,
      postureType: result.postureType,
      severity: result.severity,
      tiltForwardDeg: result.tiltForward,
      tiltLateralDeg: result.tiltLateral,
      ts,
    });
    broadcastPosture({ ...message, type: 'posture_alert' });
  }
}

function registerRoutes(app) {
  app.post('/api/telemetry', async (req, res) => {
    try {
      await handleTelemetry(req.body);
      res.status(204).end();
    } catch (err) {
      console.error(err);
      const status = err.message && err.message.includes('JSON') ? 400 : 500;
      res.status(status).json({ error: err.message });
    }
  });

  app.get('/api/telemetry', async (req, res) => {
    try {
      const limit = Math.min(Number.parseInt(req.query.limit, 10) || 100, 500);
      const data = await getRecentTelemetry(limit);
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/posture-events', async (req, res) => {
    try {
      const limit = Math.min(Number.parseInt(req.query.limit, 10) || 50, 200);
      const data = await getRecentPostureEvents(limit);
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'smartposture-backend' });
  });
}

module.exports = { registerRoutes, handleTelemetry, setBroadcast };
