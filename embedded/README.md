# SmartPosture – Couche embarquée (simulateur)

Code Arduino pour le gilet connecté CorpSafe v1. Lecture accéléromètre / gyroscope (MPU-6050 ou simulation) et envoi JSON sur le port série.

## Simulateur

- **Wokwi** : [Créer un projet](https://wokwi.com/projects/new/arduino-uno), coller le contenu de `smartposture.ino`, ajouter un Arduino Uno. Le Serial Monitor affichera le JSON.
- **Lien projet partagé** : après sauvegarde sur Wokwi, ajouter l’URL ici et dans le README racine du dépôt.
  - Exemple : `https://wokwi.com/projects/xxxxxxxx`

## Câblage (si MPU-6050 utilisé dans le simulateur)

| MPU-6050 | Arduino Uno |
|----------|-------------|
| VCC      | 3.3V        |
| GND      | GND         |
| SCL      | A5 (SCL)    |
| SDA      | A4 (SDA)    |

Dans le code, définir `#define USE_MPU6050` et inclure la librairie Adafruit MPU6050 si disponible dans l’environnement.

## Format de sortie (Serial)

Une ligne JSON par trame, environ 5 Hz :

```json
{"accel":{"x":0.02,"y":0.01,"z":0.98},"gyro":{"x":1.2,"y":-0.5,"z":0.1},"ts":12345}
```

- `accel` : accélération en g (X, Y, Z).
- `gyro` : vitesse angulaire en °/s (X, Y, Z).
- `ts` : timestamp Arduino `millis()`.

## Mode manuel (pont gateway)

1. Ouvrir le Serial Monitor du simulateur (115200 baud).
2. Copier une ou plusieurs lignes JSON.
3. Les coller dans le pont Node.js (mode manuel) qui les enverra au backend (MQTT ou API). Voir `../gateway/README.md`.

## Fichiers

- `smartposture.ino` : sketch principal (simulation ou MPU-6050 si `USE_MPU6050` défini).
- `wokwi.toml` : configuration optionnelle du projet Wokwi.
