require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const dbModule = require('./index');

async function run() {
  await dbModule.connect();
  const db = dbModule.getDb();
  const telemetryCol = db.collection('telemetry');
  const postureCol = db.collection('posture_events');
  await telemetryCol.createIndex({ ts: -1 });
  await telemetryCol.createIndex({ device_id: 1 });
  await postureCol.createIndex({ ts: -1 });
  await postureCol.createIndex({ device_id: 1 });
  console.log('MongoDB indexes created (telemetry, posture_events)');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
