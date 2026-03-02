export function AlertsList({ alerts }) {
  if (!alerts.length) {
    return (
      <div className="alerts-list empty">
        <p>Aucune alerte récente</p>
      </div>
    );
  }

  return (
    <ul className="alerts-list">
      {alerts.map((a) => (
        <li key={a.id} className={`severity-${a.severity || 'alert'}`}>
          <strong>{a.postureType === 'bent_forward' ? 'Flexion avant' : 'Inclinaison latérale'}</strong>
          {' — '}
          {a.tiltForward != null && `${a.tiltForward.toFixed(1)}°`}
          {a.tiltLateral != null && a.tiltForward != null && ' / '}
          {a.tiltLateral != null && `${a.tiltLateral.toFixed(1)}°`}
          {a.zone && ` — Zone: ${a.zone}`}
        </li>
      ))}
    </ul>
  );
}
