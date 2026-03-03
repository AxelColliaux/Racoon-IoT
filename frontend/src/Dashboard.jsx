import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePostureWebSocket } from './api/usePostureWebSocket';
import { loadHistory } from './api/history';
import { fetchVests } from './api/vests';
import { PostureChart } from './components/PostureChart';
import { VestSimulation3D } from './components/VestSimulation3D';
import { VestManager } from './components/VestManager';

/* ── tiny helpers ─────────────────────────────────────────────────── */
function fmtAngle(v) {
  return v != null ? `${Math.abs(v).toFixed(1)}°` : '—';
}
function severityOf(posture) {
  if (!posture) return 'unknown';
  return posture.severity || 'ok';
}
function severityLabel(s) {
  return { ok: 'NORMAL', warning: 'ATTENTION', alert: 'DANGER' }[s] || '—';
}
function severityIcon(s) {
  return { ok: '🟢', warning: '🟡', alert: '🔴' }[s] || '⚪';
}
function postureLabel(type) {
  return type === 'bent_forward' ? 'Flexion dos' : type === 'lateral_lean' ? 'Inclinaison lat.' : type || '—';
}
function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

const ALL = '__all__';

export default function Dashboard() {
  const { lastPosture, alerts, connected } = usePostureWebSocket();
  const [history, setHistory] = useState([]);
  const [persistedAlerts, setPersistedAlerts] = useState([]);
  const [vests, setVests] = useState([]);
  const [vestStates, setVestStates] = useState({}); // { deviceId: lastPosture }
  const [perVestHistory, setPerVestHistory] = useState({}); // { deviceId: [points] }

  // filter: which vests to show in monitoring table / alerts / chart
  const [filterVests, setFilterVests] = useState([ALL]);
  // sim: which single vest to show in 3D
  const [simVest, setSimVest] = useState(ALL);

  /* load persisted data + vests (history from DB so chart shows evolution after reload) */
  useEffect(() => {
    loadHistory({ telemetryLimit: 200, eventsLimit: 50 })
      .then(({ telemetry, events }) => {
        if (telemetry.length > 0) setHistory(telemetry);
        if (events.length > 0) setPersistedAlerts(events);
      })
      .catch(() => {});
    loadVests();
  }, []);

  const loadVests = useCallback(() => {
    fetchVests().then(setVests).catch(() => {});
  }, []);

  /* track per-vest live state + per-vest history */
  useEffect(() => {
    if (lastPosture && lastPosture.deviceId) {
      const did = lastPosture.deviceId;
      setVestStates((prev) => ({ ...prev, [did]: lastPosture }));
      setPerVestHistory((prev) => ({
        ...prev,
        [did]: [...(prev[did] || []), lastPosture].slice(-200),
      }));
    }
  }, [lastPosture]);

  /* global history for chart */
  useEffect(() => {
    if (lastPosture) {
      setHistory((prev) => [...prev, lastPosture].slice(-200));
    }
  }, [lastPosture]);

  const allAlerts = useMemo(
    () => [...persistedAlerts, ...alerts],
    [persistedAlerts, alerts],
  );

  /* count active vests */
  const activeVestCount = useMemo(() => {
    const threshold = Date.now() - 30_000;
    return Object.values(vestStates).filter(
      (p) => p && p.ts && p.ts > threshold,
    ).length;
  }, [vestStates, lastPosture]);

  /* ── filtering helpers ──────────────────────────────────────── */
  const isAll = filterVests.includes(ALL);

  // vests shown in monitoring
  const displayedVests = isAll
    ? vests
    : vests.filter((v) => filterVests.includes(v.vest_id));

  // alerts filtered
  const filteredAlerts = isAll
    ? allAlerts
    : allAlerts.filter((a) => filterVests.includes(a.deviceId));

  // chart history filtered : combine persisted history (from DB) + live per-vest history
  const filteredHistory = useMemo(() => {
    if (isAll) return history;
    const fromDb = history.filter((p) => p.deviceId && filterVests.includes(p.deviceId));
    const fromLive = filterVests.flatMap((id) => perVestHistory[id] || []);
    const merged = [...fromDb, ...fromLive].sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0)).slice(-200);
    return merged;
  }, [isAll, filterVests, history, perVestHistory]);

  // Build unified list of vest options (registered + live unregistered)
  const filterOptions = useMemo(() => {
    const registeredIds = new Set(vests.map((v) => v.vest_id));
    const opts = vests.map((v) => ({ id: v.vest_id, label: v.label || '' }));
    Object.keys(vestStates).forEach((did) => {
      if (!registeredIds.has(did)) opts.push({ id: did, label: '' });
    });
    return opts;
  }, [vests, vestStates]);

  // Options visible in sim dropdown = what the current filter allows
  const displayedOptions = isAll
    ? filterOptions
    : filterOptions.filter((o) => filterVests.includes(o.id));

  // Auto-sync simVest when filter changes
  const effectiveSimVest = useMemo(() => {
    if (isAll) return simVest;                       // user picks freely
    if (displayedOptions.length === 1) return displayedOptions[0].id; // auto-lock
    if (displayedOptions.find((o) => o.id === simVest)) return simVest; // keep current
    return displayedOptions[0]?.id || ALL;            // fallback
  }, [isAll, simVest, displayedOptions]);

  // 3D sim posture
  const simPosture =
    effectiveSimVest === ALL || !effectiveSimVest
      ? lastPosture
      : vestStates[effectiveSimVest] || null;

  /* ── multi-select toggle ────────────────────────────────────── */
  function toggleFilter(id) {
    setFilterVests((prev) => {
      if (id === ALL) return [ALL];
      const without = prev.filter((x) => x !== ALL);
      const has = without.includes(id);
      const next = has ? without.filter((x) => x !== id) : [...without, id];
      return next.length === 0 ? [ALL] : next;
    });
  }

  return (
    <>
      {/* ── KPI ROW ────────────────────────────────────────────── */}
      <section className="kpi-row">
        <div className="kpi-card">
          <span className="kpi-icon">🦺</span>
          <div>
            <p className="kpi-value">{vests.length}</p>
            <p className="kpi-label">Gilet{vests.length !== 1 ? 's' : ''} enregistré{vests.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="kpi-card">
          <span className="kpi-icon">📡</span>
          <div>
            <p className="kpi-value">{activeVestCount}</p>
            <p className="kpi-label">
              Actif{activeVestCount !== 1 ? 's' : ''} en ligne
            </p>
          </div>
        </div>
        <div className="kpi-card">
          <span className="kpi-icon">🔴</span>
          <div>
            <p className="kpi-value">{allAlerts.length}</p>
            <p className="kpi-label">Alertes du jour</p>
          </div>
        </div>
      </section>

      {/* ── VEST MANAGER ───────────────────────────────────────── */}
      <section className="card">
        <VestManager vests={vests} onRefresh={loadVests} />
      </section>

      {/* ── VEST FILTER BAR ────────────────────────────────────── */}
      <section className="filter-bar">
        <span className="filter-label">Filtrer :</span>
        <button
          className={`filter-chip ${isAll ? 'active' : ''}`}
          onClick={() => toggleFilter(ALL)}
        >
          Tous
        </button>
        {filterOptions.map((opt) => (
          <button
            key={opt.id}
            className={`filter-chip ${filterVests.includes(opt.id) ? 'active' : ''}`}
            onClick={() => toggleFilter(opt.id)}
          >
            {opt.id}
            {opt.label && opt.label !== opt.id ? ` — ${opt.label}` : ''}
          </button>
        ))}
      </section>

      {/* ── MONITORING + ALERTS SIDE-BY-SIDE ───────────────────── */}
      <section className="split-row">
        {/* left: live monitoring table */}
        <div className="card monitoring-card">
          <h2>📡 Monitoring en direct</h2>
          <table className="monitor-table">
            <thead>
              <tr>
                <th>ID Gilet</th>
                <th>Statut</th>
                <th>Angle Y</th>
                <th>Angle Z</th>
              </tr>
            </thead>
            <tbody>
              {displayedVests.length > 0 ? (
                displayedVests.map((v) => {
                  const state = vestStates[v.vest_id];
                  const sev = severityOf(state);
                  return (
                    <tr key={v.vest_id} className={`row-severity-${sev}`}>
                      <td className="cell-id">
                        {v.vest_id}
                        {v.operator && (
                          <span className="cell-operator"> — {v.operator}</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-pill pill-${sev}`}>
                          {severityIcon(sev)} {severityLabel(sev)}
                        </span>
                      </td>
                      <td className="cell-angle">{fmtAngle(state?.tiltForward)}</td>
                      <td className="cell-angle">{fmtAngle(state?.tiltLateral)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr className={`row-severity-${severityOf(lastPosture)}`}>
                  <td className="cell-id">{lastPosture?.deviceId || '—'}</td>
                  <td>
                    <span className={`status-pill pill-${severityOf(lastPosture)}`}>
                      {severityIcon(severityOf(lastPosture))} {severityLabel(severityOf(lastPosture))}
                    </span>
                  </td>
                  <td className="cell-angle">{fmtAngle(lastPosture?.tiltForward)}</td>
                  <td className="cell-angle">{fmtAngle(lastPosture?.tiltLateral)}</td>
                </tr>
              )}
            </tbody>
          </table>
          {!connected && (
            <p className="monitor-hint">
              ⚠️ Déconnecté — Vérifiez que le backend tourne (port 3000)
            </p>
          )}
        </div>

        {/* right: alert journal */}
        <div className="card journal-card">
          <h2>⚠️ Journal des alertes</h2>
          {filteredAlerts.length === 0 ? (
            <p className="journal-empty">Aucune alerte enregistrée</p>
          ) : (
            <ul className="journal-list">
              {filteredAlerts.slice(0, 30).map((a, i) => (
                <li key={a.id || i}>
                  <span className="journal-time">{fmtTime(a.ts)}</span>
                  <span className="journal-device">{a.deviceId || '—'}</span>
                  <span className="journal-type">{postureLabel(a.postureType)}</span>
                  <span className="journal-detail">
                    {a.severity === 'alert' ? '🔴' : '🟡'}{' '}
                    Angle Y à {fmtAngle(a.tiltForward)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── 3D SIMULATION ──────────────────────────────────────── */}
      <section className="card simulation-card">
        <div className="sim-header">
          <h2>🧍 Simulation 3D</h2>
          {displayedOptions.length > 1 && (
            <select
              className="sim-select"
              value={simVest}
              onChange={(e) => setSimVest(e.target.value)}
            >
              {displayedOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.id}{opt.label && opt.label !== opt.id ? ` — ${opt.label}` : ''}
                </option>
              ))}
            </select>
          )}
          {displayedOptions.length === 1 && (
            <span className="sim-vest-tag">{displayedOptions[0].id}</span>
          )}
        </div>
        <VestSimulation3D posture={simPosture} />
      </section>

      {/* ── CHART ──────────────────────────────────────────────── */}
      <section className="card chart-card">
        <PostureChart history={filteredHistory} />
      </section>
    </>
  );
}

