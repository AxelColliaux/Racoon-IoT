# SmartPosture – Backend

API REST, base MongoDB, moteur de détection de posture et WebSocket pour le dashboard temps réel.

## Prérequis

- Node.js 18+
- MongoDB (local ou Atlas) et une URL de connexion

## Installation

```bash
cd backend && npm install
```

Définir `MONGODB_URI` (voir Configuration). Optionnel : `npm run init-db` pour créer les index MongoDB.

## Configuration

| Variable           | Description                    | Défaut           |
|--------------------|--------------------------------|------------------|
| `MONGODB_URI`      | **Obligatoire.** URL de connexion MongoDB (ex. `mongodb://localhost:27017` ou Atlas) | — |
| `MONGODB_DB_NAME`  | Nom de la base MongoDB         | `smartposture`   |
| `PORT`             | Port HTTP                      | `3000`           |
| `MQTT_BROKER`      | URL broker MQTT (optionnel)    | —                |
| `MQTT_TOPIC`       | Topic MQTT télémetrie          | `smartposture/telemetry` |

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
