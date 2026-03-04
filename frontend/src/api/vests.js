import { authFetch } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/** GET /api/vests */
export async function fetchVests() {
  const res = await authFetch(`${API_BASE}/api/vests`);
  if (!res.ok) return [];
  return res.json();
}

/** POST /api/vests — vestId optionnel : si fourni, enregistre le gilet avec l'ID du device (ex. Arduino) */
export async function registerVest({ vestId, label, operator, zone }) {
  const res = await authFetch(`${API_BASE}/api/vests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vestId: vestId || undefined, label, operator, zone }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to register vest');
  return data;
}

/** PUT /api/vests/:vestId */
export async function updateVest(vestId, fields) {
  const res = await authFetch(`${API_BASE}/api/vests/${encodeURIComponent(vestId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update vest');
  return data;
}

/** DELETE /api/vests/:vestId */
export async function deleteVest(vestId) {
  const res = await authFetch(`${API_BASE}/api/vests/${encodeURIComponent(vestId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to delete vest');
  }
}
