/**
 * Détection de posture par règles à seuils (accéléromètre).
 * Angles dérivés des axes : inclinaison avant/arrière (X), latérale (Y).
 */

const DEG_PER_RAD = 180 / Math.PI;

function accelToTiltDeg(ax, ay, az) {
  const axNorm = ax ?? 0, ayNorm = ay ?? 0, azNorm = az ?? 1;
  const norm = Math.sqrt(axNorm * axNorm + ayNorm * ayNorm + azNorm * azNorm) || 1;
  const axg = axNorm / norm, ayg = ayNorm / norm, azg = azNorm / norm;
  const tiltForward = Math.atan2(-axg, Math.sqrt(ayg * ayg + azg * azg)) * DEG_PER_RAD;
  const tiltLateral = Math.atan2(ayg, Math.sqrt(axg * axg + azg * azg)) * DEG_PER_RAD;
  return { tiltForward: tiltForward, tiltLateral: tiltLateral };
}

const THRESHOLDS = {
  forwardWarning: 16,
  forwardAlert: 31,
  lateralWarning: 15,
  lateralAlert: 30,
};
const SUSTAINED_MS = 1500;
const state = { lastAlert: null, sustainedSince: null };

function detect(sample) {
  const accel = sample.accel || {};
  const { tiltForward, tiltLateral } = accelToTiltDeg(
    accel.x, accel.y, accel.z
  );
  const absForward = Math.abs(tiltForward);
  const absLateral = Math.abs(tiltLateral);
  const ts = sample.ts ?? Date.now();

  let severity = 'ok';
  let postureType = 'normal';

  if (absForward >= THRESHOLDS.forwardAlert || absLateral >= THRESHOLDS.lateralAlert) {
    severity = 'alert';
    postureType = absForward >= THRESHOLDS.forwardAlert ? 'bent_forward' : 'bent_lateral';
  } else if (absForward >= THRESHOLDS.forwardWarning || absLateral >= THRESHOLDS.lateralWarning) {
    severity = 'warning';
    postureType = absForward >= THRESHOLDS.forwardWarning ? 'bent_forward' : 'bent_lateral';
  }

  const result = {
    postureType,
    severity,
    tiltForward,
    tiltLateral,
    ts,
    accel: sample.accel,
    gyro: sample.gyro,
  };

  if (severity !== 'ok') {
    const key = `${severity}-${postureType}`;
    if (state.lastAlert !== key) {
      state.lastAlert = key;
      state.sustainedSince = ts;
    }
    const sustained = (ts - state.sustainedSince) >= SUSTAINED_MS;
    result.sustained = sustained;
    result.shouldEmitAlert = sustained;
  } else {
    state.lastAlert = null;
    state.sustainedSince = null;
  }

  return result;
}

module.exports = { detect, accelToTiltDeg, THRESHOLDS };
