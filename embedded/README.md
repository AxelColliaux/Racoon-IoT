# SmartPosture – Couche embarquée (simulateur)

Code Arduino pour le gilet connecté CorpSafe v1. Lecture accéléromètre / gyroscope (MPU-6050 ou simulation) et envoi JSON sur le port série.

## Simulateur

- **Wokwi (navigateur)** : [Créer un projet](https://wokwi.com/projects/new/arduino-uno), importer ou coller le code de `smartposture.ino` et le contenu de `diagram.json` (Arduino Uno + MPU6050 câblé en I2C). Démarrer la simulation puis ouvrir le Serial Monitor (115200 baud) : les lignes JSON s’affichent. Ne pas utiliser `while (!Serial)` dans le code (bloque dans le simulateur).
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

## Mode TCP (Wokwi for VS Code)

Pour que le Serial Monitor affiche le JSON et que la gateway reçoive les données en TCP :

1. **Compiler le firmware** (une fois, ou après chaque modification du code) :
   ```bash
   cd embedded && pio run
   ```
   (Installer [PlatformIO](https://platformio.org/) si besoin : extension « PlatformIO IDE » dans VS Code, ou `pip install platformio`.)

2. **Lancer la simulation** : dans VS Code, ouvrir le dossier `embedded/`, puis F1 → « Wokwi: Start Simulator ». Le Serial Monitor doit afficher les lignes JSON.

3. **Lancer la gateway en TCP** : `cd gateway && npm run tcp`. Elle se connecte à `localhost:4000` et envoie les trames au backend.

Sans étape 1, Wokwi n’exécute aucun code : le port TCP est ouvert mais aucun flux série n’est envoyé.

**Wokwi dans le navigateur (wokwi.com)** n’ouvre pas de serveur TCP sur ta machine : dans ce cas, utiliser le mode **mock** de la gateway ou le copier-coller (mode manuel).

## Mode manuel (pont gateway)

1. Ouvrir le Serial Monitor du simulateur (115200 baud).
2. Copier une ou plusieurs lignes JSON.
3. Les coller dans le pont Node.js (mode manuel) qui les enverra au backend (MQTT ou API). Voir `../gateway/README.md`.

## Fichiers

- `smartposture.ino` : sketch principal (simulation ou MPU-6050 si `USE_MPU6050` défini).
- `wokwi.toml` : configuration optionnelle du projet Wokwi.
