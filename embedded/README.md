# SmartPosture – Couche embarquée (simulateur)

Code Arduino pour le gilet connecté CorpSafe v1. Lecture accéléromètre / gyroscope (MPU-6050 ou simulation) et envoi JSON sur le port série.

## Simulateur

- **Wokwi (navigateur)** : [Créer un projet](https://wokwi.com/projects/new/arduino-uno), importer ou coller le code de `smartposture.ino` et le contenu de `diagram.json` (Arduino Uno + MPU6050 câblé en I2C). Démarrer la simulation puis ouvrir le Serial Monitor (115200 baud) : les lignes JSON s’affichent. Ne pas utiliser `while (!Serial)` dans le code (bloque dans le simulateur).
- **Lien projet partagé** : après sauvegarde sur Wokwi, ajouter l’URL ici et dans le README racine du dépôt.
  - Exemple : `https://wokwi.com/projects/xxxxxxxx`

## Câblage (si MPU-6050 utilisé dans le simulateur)

Le montage peut utiliser **1 ou 2** MPU-6050 sur le même bus I2C pour améliorer la précision (moyenne des mesures). Avec 2 capteurs, le firmware envoie une seule trame JSON (accel/gyro moyennés).

| MPU-6050   | Arduino Uno | Note                    |
|------------|-------------|-------------------------|
| VCC        | 5V          | (ou 3.3V)               |
| GND        | GND         |                         |
| SCL        | A5 (SCL)    | Partagé si 2 capteurs   |
| SDA        | A4 (SDA)    | Partagé si 2 capteurs   |
| AD0        | GND ou NC   | Capteur 1 → adresse 0x68 (placement corps : entre les omoplates) |
| AD0        | 5V          | Capteur 2 uniquement → adresse 0x69 (placement corps : région lombaire) |

Dans le code, définir `#define USE_MPU6050` et inclure la librairie Adafruit MPU6050. Avec 2 capteurs, le sketch initialise `mpu1.begin(0x68)` et `mpu2.begin(0x69)`, lit les deux puis moyenne accel et gyro avant envoi JSON. Sur le gilet : capteur 1 = omoplates, capteur 2 = lombaires (voir [docs/vest-placement.md](../docs/vest-placement.md)).

## Format de sortie (Serial)

Une ligne JSON par trame, environ 5 Hz :

```json
{"accel":{"x":0.02,"y":0.01,"z":0.98},"gyro":{"x":1.2,"y":-0.5,"z":0.1},"ts":12345,"sensors":2}
```

- `accel` : accélération en g (X, Y, Z), moyennée si 2 capteurs.
- `gyro` : vitesse angulaire en °/s (X, Y, Z), moyennée si 2 capteurs.
- `ts` : timestamp Arduino `millis()`.
- `sensors` : (optionnel) nombre de capteurs utilisés (2 si double MPU-6050).

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

- `src/smartposture.ino` : sketch principal (simulation ou 1/2 MPU-6050 si `USE_MPU6050` défini). Avec 2 capteurs, lecture I2C 0x68 et 0x69 puis moyenne.
- `diagram.json` : schéma Wokwi (Arduino Uno + 2× MPU-6050 avec AD0 du second à 5V).
- `wokwi.toml` : configuration projet Wokwi (firmware compilé .hex).
