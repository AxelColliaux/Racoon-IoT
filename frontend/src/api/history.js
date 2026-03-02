/**
 * Chargement de l'historique persistant (télémétrie + événements posture)
 * depuis le backend. Utilisé au montage du dashboard pour afficher les
 * données même après redémarrage (mock ou TCP).
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const DEG_PER_RAD = 180 / Math.PI;

/** Calcule inclinaison avant/latérale à partir des accélérations (même formule que le backend). */
export function accelToTiltDeg(ax, ay, az) {
  const axNorm = ax ?? 0;
  const ayNorm = ay ?? 0;
  const azNorm = az ?? 1;
  const norm = Math.sqrt(axNorm * axNorm + ayNorm * ayNorm + azNorm * azNorm) || 1;
  const axg = axNorm / norm;
  const ayg = ayNorm / norm;
  const azg = azNorm / norm;
  const tiltForward = Math.atan2(-axg, Math.sqrt(ayg * ayg + azg * azg)) * DEG_PER_RAD;
  const tiltLateral = Math.atan2(ayg, Math.sqrt(axg * axg + azg * azg)) * DEG_PER_RAD;
  return { tiltForward, tiltLateral };
}

/**
 * Récupère les N dernières télémétries et les convertit en points pour le graphique.
 * Les lignes sont renvoyées par le backend en ordre ts DESC → on inverse pour avoir ancien → récent.
 */
export async function fetchTelemetryHistory(limit = 200) {
  const res = await fetch(`${API_BASE}/api/telemetry?limit=${limit}`);
  if (!res.ok) return [];
  const rows = await res.json();
  const points = rows.map((r) => {
    const { tiltForward, tiltLateral } = accelToTiltDeg(r.accel_x, r.accel_y, r.accel_z);
    return { tiltForward, tiltLateral, ts: r.ts };
  });
  return points.reverse();
}

/**
 * Récupère les N derniers événements de posture (alertes) pour l'affichage.
 */
export async function fetchPostureEventsHistory(limit = 50) {
  const res = await fetch(`${API_BASE}/api/posture-events?limit=${limit}`);
  if (!res.ok) return [];
  const rows = await res.json();
  return rows.map((r) => ({
    id: `persisted-${r.id}`,
    postureType: r.posture_type,
    severity: r.severity,
    tiltForward: r.tilt_forward_deg,
    tiltLateral: r.tilt_lateral_deg,
    zone: r.zone,
    ts: r.ts,
  }));
}

/**
 * Charge télémétrie + événements en une seule fois (pour le montage du dashboard).
 */
export async function loadHistory(options = {}) {
  const { telemetryLimit = 200, eventsLimit = 50 } = options;
  const [telemetry, events] = await Promise.all([
    fetchTelemetryHistory(telemetryLimit),
    fetchPostureEventsHistory(eventsLimit),
  ]);
  return { telemetry, events };
}
