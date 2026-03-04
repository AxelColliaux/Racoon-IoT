/**
 * Mode auto-test : génère des données accel/gyro réalistes
 * pour développer backend et dashboard sans simulateur Arduino.
 * Simule postures : normale, penchée avant, torsion, etc.
 */

const POSTURES = {
  normal: { name: 'normal', accelZ: 0.98, tiltX: 0, tiltY: 0 },
  bent_forward: { name: 'bent_forward', accelZ: 0.6, tiltX: 0.35, tiltY: 0 },
  bent_lateral: { name: 'bent_lateral', accelZ: 0.9, tiltX: 0, tiltY: 0.25 },
  twist: { name: 'twist', accelZ: 0.85, tiltX: 0.1, tiltY: 0.15 },
};

function noise(scale = 0.02) {
  return (Math.random() - 0.5) * 2 * scale;
}

function generateSample(postureKey = 'normal', ts = Date.now()) {
  const p = POSTURES[postureKey] || POSTURES.normal;
  const ax = (p.tiltX || 0) + noise(0.01);
  const ay = (p.tiltY || 0) + noise(0.01);
  const az = (p.accelZ || 0.98) + noise(0.01);
  const gx = noise(5);
  const gy = noise(5);
  const gz = noise(3);
  return {
    accel: { x: ax, y: ay, z: az },
    gyro: { x: gx, y: gy, z: gz },
    ts,
    posture: p.name,
    temperature: 20 + Math.random() * 10,
    status: 'up',
  };
}

const POSTURE_KEYS = ['normal', 'normal', 'bent_forward', 'normal', 'bent_lateral', 'normal', 'twist'];

function runMockGenerator(onSample, options = {}) {
  const intervalMs = options.intervalMs ?? 10000;
  let i = 0;
  const timer = setInterval(() => {
    const key = POSTURE_KEYS[i % POSTURE_KEYS.length];
    i++;
    const sample = generateSample(key, Date.now());
    onSample(sample);
  }, intervalMs);
  return () => clearInterval(timer);
}

module.exports = { generateSample, runMockGenerator, POSTURES };
