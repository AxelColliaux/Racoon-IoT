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

## Lancement

```bash
npm run dev
```

Ouvrir http://localhost:5173. Le dashboard se connecte au WebSocket du backend et affiche les postures et alertes en temps réel.

## Build

```bash
npm run build
npm run preview
```
