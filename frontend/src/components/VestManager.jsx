import { useState } from 'react';
import { registerVest, deleteVest } from '../api/vests';

export function VestManager({ vests, onRefresh, availableDeviceIds = [] }) {
  const [open, setOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [label, setLabel] = useState('');
  const [operator, setOperator] = useState('');
  const [zone, setZone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log({
      vestId: selectedDeviceId.trim() || undefined,
      label: label.trim() || undefined,
      operator: operator.trim() || undefined,
      zone: zone.trim() || undefined,
    });
    try {
      await registerVest({
        vestId: selectedDeviceId.trim() || undefined,
        label: label.trim() || undefined,
        operator: operator.trim() || undefined,
        zone: zone.trim() || undefined,
      });
      setSelectedDeviceId('');
      setLabel('');
      setOperator('');
      setZone('');
      setOpen(false);
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const [deleting, setDeleting] = useState(null);

  async function handleDelete(id) {
    console.log('handleDelete called with:', id);
    setDeleting(id);
    try {
      const res = await fetch(`http://localhost:3000/api/vests/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('sp_token')}` },
      });
      console.log('Delete response status:', res.status);
      if (res.ok || res.status === 204) {
        onRefresh();
      } else {
        const text = await res.text();
        console.error('Delete failed:', res.status, text);
        setError(`Erreur ${res.status}: ${text}`);
      }
    } catch (err) {
      console.error('Delete vest network error:', err);
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="vest-manager">
      <div className="vest-mgr-header">
        <h2>🦺 Gilets enregistrés ({vests.length})</h2>
        <button className="vest-add-btn" onClick={() => setOpen(!open)}>
          {open ? '✕ Annuler' : '+ Ajouter un gilet'}
        </button>
      </div>

      {open && (
        <form className="vest-form" onSubmit={handleAdd}>
          {availableDeviceIds.length > 0 && (
            <div className="vest-form-row">
              <label htmlFor="vest-device-select">Lier à un device détecté (optionnel)</label>
              <select
                id="vest-device-select"
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="vest-device-select"
              >
                <option value="">— Nouveau gilet (ID auto, ex. V-001) —</option>
                {availableDeviceIds.map((did) => (
                  <option key={did} value={did}>
                    {did} — gilet non lié
                  </option>
                ))}
              </select>
            </div>
          )}
          <input
            type="text"
            placeholder="Nom / label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            autoFocus={availableDeviceIds.length === 0}
          />
          <input
            type="text"
            placeholder="Opérateur"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
          />
          <input
            type="text"
            placeholder="Zone"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
          />
          <p className="vest-hint">
            {selectedDeviceId
              ? `Le gilet sera enregistré avec l'ID du device : ${selectedDeviceId}`
              : "L'ID du gilet sera attribué automatiquement (ex : V-001)"}
          </p>
          {error && <p className="vest-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? '...' : selectedDeviceId ? 'Lier et enregistrer' : 'Enregistrer'}
          </button>
        </form>
      )}

      {vests.length === 0 ? (
        <p className="vest-empty">Aucun gilet enregistré. Ajoutez-en un pour commencer.</p>
      ) : (
        <div className="vest-list">
          {vests.map((v) => (
            <div key={v.vest_id} className="vest-item">
              <span className="vest-item-id">{v.vest_id}</span>
              <div className="vest-item-main">
                {v.label && v.label !== v.vest_id && (
                  <span className="vest-item-label">{v.label}</span>
                )}
              </div>
              <div className="vest-item-meta">
                {v.operator && <span>👷 {v.operator}</span>}
                {v.zone && <span>📍 {v.zone}</span>}
              </div>
              <button
                className="vest-delete-btn"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete(v.vest_id);
                }}
                disabled={deleting === v.vest_id}
                title="Supprimer"
              >
                {deleting === v.vest_id ? '⏳...' : '🗑️ Supprimer'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
