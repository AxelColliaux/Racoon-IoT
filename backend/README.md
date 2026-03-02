# SmartPosture – Backend

API REST, base SQLite, moteur de détection de posture et WebSocket pour le dashboard temps réel.

## Prérequis

- Node.js 18+

## Installation

```bash
cd backend && npm install
npm run init-db
```

## Configuration

| Variable      | Description              | Défaut        |
|---------------|--------------------------|---------------|
| `PORT`        | Port HTTP                | `3000`        |
| `DB_PATH`     | Chemin fichier SQLite    | `data/smartposture.db` |
| `MQTT_BROKER` | URL broker MQTT (optionnel) | —          |
| `MQTT_TOPIC`  | Topic MQTT télémetrie    | `smartposture/telemetry` |

## Lancement

```bash
npm start
```

- **REST** : `POST /api/telemetry` (ingestion), `GET /api/telemetry`, `GET /api/posture-events`, `GET /api/health`
- **WebSocket** : `ws://localhost:3000/ws` — envoi des événements `posture` et `posture_alert` en temps réel

## MQTT (optionnel)

Pour ingérer via MQTT : définir `MQTT_BROKER` (ex. `mqtt://localhost:1883`). Broker local avec Docker :

```bash
docker compose --profile mqtt up -d
```

## Détection posture

Règles à seuils dans `src/posture/detector.js` : inclinaison avant/latérale dérivée de l’accéléromètre ; seuils warning/alert et durée maintenue pour émettre une alerte.
