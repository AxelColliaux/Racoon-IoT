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

- `MONGODB_URI` : **obligatoire**, URL de connexion MongoDB (ex. `mongodb://localhost:27017`)
- `MONGODB_DB_NAME` : nom de la base (`smartposture` par défaut)
- `PORT` : port HTTP (`3000` par défaut)
- `MQTT_BROKER` : URL broker MQTT (optionnel)
- `MQTT_TOPIC` : topic MQTT legacy (`smartposture/telemetry`)
- `MQTT_TOPIC_HIERARCHY` : wildcard topics hiérarchiques (`racoon/+/+/+`)
- `TS_RETENTION_SECONDS` : rétention brute time-series en secondes (`600`)
- `AGGREGATION_INTERVAL_MS` : fréquence du job d'agrégation (`60000`)

## Lancement

```bash
npm start
```

- **REST** : `POST /api/telemetry` (ingestion), `GET /api/telemetry`, `GET /api/posture-events`, `GET /api/telemetry-agg`, `GET /api/health`
- **WebSocket** : `ws://localhost:3000/ws` — envoi des événements `posture` et `posture_alert` en temps réel

## MQTT (optionnel)

Pour ingérer via MQTT : définir `MQTT_BROKER` (ex. `mqtt://localhost:1883`). Broker local avec Docker :

```bash
docker compose --profile mqtt up -d
```

Topics MQTT hiérarchiques supportés (ESP32) :

- `racoon/<device_id>/sensors/posture`
- `racoon/<device_id>/sensors/temperature`
- `racoon/<device_id>/alerts/status`

## Time-Series, rétention, agrégation

- Les points MQTT sont stockés dans la collection time-series `telemetry_ts`.
- Rétention brute: 10 minutes par défaut (`TS_RETENTION_SECONDS=600`).
- Une agrégation 5 minutes est recalculée régulièrement et stockée dans `telemetry_agg_5m`.

## Détection posture

Règles à seuils dans `src/posture/detector.js` : inclinaison avant/latérale dérivée de l’accéléromètre ; seuils warning/alert et durée maintenue pour émettre une alerte.
