/**
 * Gestion des messages MQTT température et statut + job d'agrégation/rétention.
 * Topics : sensors/alerts/temperature, sensors/config/status
 */

const { insertSensorReading, runAggregationAndRetention, getRecentAggregates } = require('../db');

const AGGREGATION_INTERVAL_MS = 5 * 60 * 1000; // 5 min

async function handleTemperatureMessage(payloadStr) {
  const body = typeof payloadStr === 'string' ? JSON.parse(payloadStr) : payloadStr;
  const deviceId = body.deviceId ?? 'unknown';
  const ts = body.ts ?? Date.now();
  const temperature = body.temperature;
  if (temperature == null || Number.isNaN(Number(temperature))) return;
  await insertSensorReading(
    { deviceId, device_id: deviceId },
    'temperature',
    {
      ts,
      temperature: Number(temperature),
      operator_id: body.operatorId ?? null,
      zone: body.zone ?? null,
    }
  );
}

async function handleStatusMessage(payloadStr) {
  const body = typeof payloadStr === 'string' ? JSON.parse(payloadStr) : payloadStr;
  const deviceId = body.deviceId ?? 'unknown';
  const ts = body.ts ?? Date.now();
  const status = body.status ?? 'up';
  await insertSensorReading(
    { deviceId, device_id: deviceId },
    'status',
    {
      ts,
      status: String(status),
      operator_id: body.operatorId ?? null,
      zone: body.zone ?? null,
    }
  );
}

function startAggregationJob() {
  const interval = setInterval(async () => {
    try {
      await runAggregationAndRetention();
    } catch (err) {
      console.error('[Aggregation] Error:', err.message);
    }
  }, AGGREGATION_INTERVAL_MS);
  return () => clearInterval(interval);
}

function registerRoutes(app) {
  app.get('/api/aggregates', async (req, res) => {
    try {
      const limit = Math.min(Number.parseInt(req.query.limit, 10) || 100, 500);
      const deviceId = req.query.deviceId || null;
      const data = await getRecentAggregates(limit, deviceId);
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
}

module.exports = {
  handleTemperatureMessage,
  handleStatusMessage,
  startAggregationJob,
  registerRoutes,
};
