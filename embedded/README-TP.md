# README TP

Le gilet fonctionne avec une **ESP32**.

Il fait maintenant 4 choses :

- lit la posture (2 capteurs MPU6050)
- lit la température (LM35)
- envoie un statut `up` (pour dire que la carte est allumée)
- se met en **deep sleep** et se réveille toutes les **10 secondes**

## Données envoyées

Les données partent sur 3 topics MQTT :

- `racoon/gilet_01/sensors/posture`
- `racoon/gilet_01/sensors/temperature`
- `racoon/gilet_01/alerts/status`

## Important

Si `WIFI_SSID`, `WIFI_PASSWORD` ou `MQTT_HOST` ne sont pas remplis dans `src/smartposture.ino` :

- il n’y a pas d’envoi MQTT
- mais le code continue à tourner et affiche les données dans le moniteur série

## Exemple de message série

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

## Backend

- Stockage des données en **Time-Series**
- Agrégation automatique toutes les **5 minutes**
- Rétention des données brutes sur **10 minutes**