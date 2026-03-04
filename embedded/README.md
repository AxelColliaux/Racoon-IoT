# Embedded – SmartPosture

Version courte et claire de l’avancement du firmware.

## Ce qui est fait

- Cible unique : **ESP32** (Wokwi + PlatformIO sur `esp32dev`).
- Capteurs : **2x MPU6050** + **LM35**
- Deep Sleep actif : réveil toutes les **10 secondes**, mesure, envoi, puis sommeil.
- JSON série envoyé à chaque réveil avec `status: "up"`.²
- MQTT publié sur 3 topics hiérarchiques :
  - `racoon/gilet_01/sensors/posture`
  - `racoon/gilet_01/sensors/temperature`
  - `racoon/gilet_01/alerts/status`

## Configuration rapide

Dans `src/smartposture.ino`, renseigner si besoin :

- `WIFI_SSID`
- `WIFI_PASSWORD`
- `MQTT_HOST`
- `MQTT_PORT`

Si ces valeurs sont vides, le firmware continue en mode série uniquement

## Exemple JSON

```json
{
  "id": "gilet_01",
  "timestamp": 12345,
  "status": "up",
  "activity": "STAND_UP",
  "posture": "GOOD_POSTURE",
  "angle_diff": 12.34,
  "temperature_c": 24.8
}
```