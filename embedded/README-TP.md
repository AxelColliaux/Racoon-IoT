# README TP

Le gilet fonctionne avec une **Arduino Uno**.

Il fait maintenant 4 choses :

- lit la posture (2 capteurs MPU6050)
- lit la température (LM35)
- envoie un statut `up` (pour dire que la carte est allumée)
- applique un **pseudo deep sleep ~10s** (mode basse conso AVR + fallback)

## Données envoyées

La chaîne complète est :

`Arduino (JSON série) -> Gateway -> MQTT -> Backend`

Les 3 topics MQTT publiés sont :

- `racoon/gilet_01/sensors/posture`
- `racoon/gilet_01/sensors/temperature`
- `racoon/gilet_01/alerts/status`

## Important

Sur Arduino Uno, le MQTT n'est pas envoyé directement par la carte : c'est la **Gateway** qui publie les topics.

Dans le terminal série, le pseudo deep sleep se voit par une nouvelle ligne JSON environ toutes **10 secondes**.

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