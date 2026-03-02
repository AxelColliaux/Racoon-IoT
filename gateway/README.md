# SmartPosture – Passerelle (Gateway)

Réception des données (Serial, WebSocket Wokwi ou mock) et envoi vers le backend (HTTP POST ou MQTT).

## Prérequis

- Node.js 18+
- Backend démarré (pour HTTP) ou broker MQTT (optionnel)

## Installation

```bash
cd gateway && npm install
```

## Configuration

Variables d'environnement (ou fichier `.env`) :

| Variable       | Description                          | Défaut                    |
|----------------|--------------------------------------|---------------------------|
| `MODE`         | `mock` \| `serial` \| `websocket`    | `mock`                    |
| `API_URL`      | URL d'ingestion backend              | `http://localhost:3000/api/telemetry` |
| `MQTT_BROKER`  | URL broker MQTT (ex. `mqtt://localhost:1883`) | —                  |
| `SERIAL_PORT`  | Port série (mode serial)             | —                         |
| `WOKWI_WS_URL` | URL WebSocket Wokwi (mode websocket) | —                         |
| `INTERVAL_MS`  | Intervalle envoi (mock) en ms        | `200`                     |
| `DEVICE_ID`    | Identifiant appareil                 | `gateway-1`               |
| `OPERATOR_ID`  | Identifiant opérateur (optionnel)    | —                         |
| `ZONE`         | Zone / chantier (optionnel)          | —                         |

## Lancement

```bash
# Mode auto-test (générateur de données réalistes)
npm run mock
# ou
npm start

# Mode Serial (pont avec Arduino / simulateur)
SERIAL_PORT=/dev/tty.usbserial-XXXX npm run serial

# Mode WebSocket (Wokwi)
WOKWI_WS_URL=wss://... npm run ws
```

Sans `MQTT_BROKER`, les données sont envoyées en HTTP POST vers `API_URL`.

## Mode manuel

Pour tester sans gateway : copier les lignes JSON du Serial Monitor du simulateur et les envoyer manuellement (ex. via curl) :

```bash
curl -X POST http://localhost:3000/api/telemetry -H "Content-Type: application/json" -d '{"accel":{"x":0,"y":0,"z":1},"gyro":{"x":0,"y":0,"z":0},"ts":12345}'
```
