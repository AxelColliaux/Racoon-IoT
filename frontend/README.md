# SmartPosture – Dashboard (frontend)

Interface temps réel pour les responsables HSE : posture actuelle, graphique d’évolution des angles, alertes.

## Prérequis

- Node.js 18+
- Backend SmartPosture démarré (port 3000)

## Installation

```bash
cd frontend && npm install
```

## Configuration

- `VITE_WS_URL` : URL WebSocket du backend (défaut : `ws://localhost:3000/ws` en dev).
- `VITE_API_URL` : URL de l’API REST du backend (défaut : `http://localhost:3000`) pour le chargement de l’historique au démarrage.

## Lancement

```bash
npm run dev
```

Ouvrir http://localhost:5173. Au chargement, le dashboard récupère l’historique persistant (télémétrie et alertes) depuis l’API, puis se connecte au WebSocket pour les mises à jour en temps réel (mock ou TCP).

## Build

```bash
npm run build
npm run preview
```
