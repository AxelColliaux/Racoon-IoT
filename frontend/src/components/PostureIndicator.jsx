export function PostureIndicator({ posture, connected }) {
  if (!posture) {
    return (
      <div className="posture-indicator posture-unknown">
        <span className="label">En attente de données</span>
        {!connected && <span className="badge disconnected">Déconnecté — Vérifiez que le backend tourne (port 3000)</span>}
        {connected && (
          <span className="hint">Connecté. Données : gateway en mode mock (<code>npm run mock</code>) ou TCP avec Wokwi for VS Code (<code>npm run tcp</code> + simu démarrée).</span>
        )}
      </div>
    );
  }

  const severity = posture.severity || 'ok';
  const labels = { ok: 'Posture OK', warning: 'Attention', alert: 'Alerte posture' };
  const tiltF = posture.tiltForward != null ? posture.tiltForward.toFixed(1) : '—';
  const tiltL = posture.tiltLateral != null ? posture.tiltLateral.toFixed(1) : '—';

  return (
    <div className={`posture-indicator posture-${severity}`}>
      <span className="label">{labels[severity] || severity}</span>
      <span className="angles">
        Incl. avant: {tiltF}° | Latérale: {tiltL}°
      </span>
      {connected && <span className="badge connected">Temps réel</span>}
    </div>
  );
}
