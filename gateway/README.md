# SmartPosture – Passerelle (Gateway)

Réception des données (Serial, TCP Wokwi ou mock) et envoi vers le backend (HTTP POST ou MQTT).

## Prérequis

- Node.js 18+
- Backend démarré (pour HTTP) ou broker MQTT (optionnel)

## Installation

```bash
cd gateway && npm install
```

## Configuration

Variables d'environnement (ou fichier `.env`) :

| Variable          | Description                          | Défaut                    |
|-------------------|--------------------------------------|---------------------------|
| `MODE`            | `mock` \| `serial` \| `tcp`          | `mock`                    |
| `API_URL`         | URL d'ingestion backend              | `http://localhost:3000/api/telemetry` |
| `MQTT_BROKER`     | URL broker MQTT (ex. `mqtt://localhost:1883`) | —                  |
| `SERIAL_PORT`     | Port série (mode serial)             | —                         |
| `WOKWI_TCP_HOST`  | Hôte TCP (mode tcp, Wokwi for VS Code) | `localhost`             |
| `WOKWI_TCP_PORT`  | Port TCP (ex. 4000 si `rfc2217ServerPort` dans wokwi.toml) | `4000` |
| `WOKWI_TCP_PORTS` | Liste de ports TCP Wokwi (multi-instance), ex. `4000,4001` | — |
| `WOKWI_DEVICE_IDS`| Mapping optionnel port→deviceId, ex. `4000:gilet_01,4001:gilet_02` | — |
| `INTERVAL_MS`     | Intervalle envoi (mock) en ms        | `200`                     |
| `DEVICE_ID`       | Identifiant appareil                 | `gateway-1`               |
| `OPERATOR_ID`     | Identifiant opérateur (optionnel)    | —                         |
| `ZONE`            | Zone / chantier (optionnel)          | —                         |

## Lancement

```bash
# Mode auto-test (générateur de données réalistes)
npm run mock
# ou
npm start

# Mode Serial (pont avec Arduino / simulateur)
SERIAL_PORT=/dev/tty.usbserial-XXXX npm run serial

# Mode TCP (Wokwi for VS Code : rfc2217ServerPort = 4000 dans wokwi.toml)
npm run tcp
# ou avec host/port personnalisés :
WOKWI_TCP_PORT=4000 npm run tcp

# Multi-instance Wokwi (plusieurs gilets simulés)
WOKWI_TCP_PORTS=4000,4001 npm run tcp
# Mapping explicite des deviceId (recommandé)
WOKWI_TCP_PORTS=4000,4001 WOKWI_DEVICE_IDS=4000:gilet_01,4001:gilet_02 npm run tcp
```

En mode multi-instance (`WOKWI_TCP_PORTS`), la gateway ouvre une connexion TCP par port.
Si `WOKWI_DEVICE_IDS` n'est pas fourni, un suffixe `-<port>` est ajouté automatiquement au `id` entrant pour éviter les collisions.

Sans `MQTT_BROKER`, les données sont envoyées en HTTP POST vers `API_URL`.

## Mode manuel

Pour tester sans gateway : copier les lignes JSON du Serial Monitor du simulateur et les envoyer manuellement (ex. via curl) :

```bash
curl -X POST http://localhost:3000/api/telemetry -H "Content-Type: application/json" -d '{"accel":{"x":0,"y":0,"z":1},"gyro":{"x":0,"y":0,"z":0},"ts":12345}'
```
