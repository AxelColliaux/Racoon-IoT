# SmartPosture – CorpSafe v1

POC complet d’un **gilet connecté d’analyse posturale** pour SafeWear Technologies : de la couche embarquée (simulateur) jusqu’au dashboard temps réel, en passant par la passerelle et le backend.

- **Objectif** : Détecter les mauvaises postures en temps réel, alerter (vibration prévue sur produit final) et fournir un dashboard HSE pour identifier zones ou tâches à risque.
- **Contraintes** : Aucun achat de composants ; tout le développement embarqué est réalisé sur simulateur (Wokwi ou Tinkercad).

## Architecture (3 couches IoT)


| Couche         | Contenu                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| **Physique**   | Microcontrôleur Arduino simulé, capteur MPU-6050 (accel + gyro) ou données simulées, sortie JSON sur Serial |
| **Passerelle** | Pont Node.js : Serial / TCP (Wokwi for VS Code) / générateur mock → envoi HTTP ou MQTT vers le backend      |
| **Cloud**      | API REST + WebSocket, base MongoDB, moteur de détection de posture (règles à seuils)                         |
| **Client**     | Dashboard React (Vite) : posture temps réel, alertes, graphique d’évolution des angles                      |


## Dépôt

- **Documentation** : [docs/data-flow.md](docs/data-flow.md), [docs/technology-choices.md](docs/technology-choices.md), [docs/vest-placement.md](docs/vest-placement.md)
- **Croquis gilet** : [docs/croquis_vue_de_face.png](docs/croquis_vue_de_face.png), [docs/croquis_vue_de_dos.png](docs/croquis_vue_de_dos.png)
- **Simulateur** : [https://wokwi.com/projects/457485083251344385](https://wokwi.com/projects/457485083251344385)
- Slides : [Slides]([https://www.canva.com/design/DAHDF3b0vUk/2NA4LRZVZ4U9AkppR5dqlQ/view?utm_content=DAHDF3b0vUk&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=he55ec66482](https://www.canva.com/design/DAHDF3b0vUk/2NA4LRZVZ4U9AkppR5dqlQ/view?utm_content=DAHDF3b0vUk&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=he55ec66482))
- Vidéo démo : [Youtube](https://youtu.be/MlCPoHRQxSU)

## Prérequis

- Node.js 18+
- (Optionnel) Docker pour le broker MQTT

## Installation et lancement

### 1. Backend

```bash
cd backend && npm install && npm run init-db && npm start
```

Le serveur écoute sur le port **3000** (API REST + WebSocket `/ws`).

### 2. Passerelle (mode auto-test)

Dans un autre terminal :

```bash
cd gateway && npm install && npm run mock
```

Les données simulées sont envoyées en HTTP POST vers `http://localhost:3000/api/telemetry`.

### 3. Dashboard

Dans un troisième terminal :

```bash
cd frontend && npm install && npm run dev
```

Ouvrir **[http://localhost:5173](http://localhost:5173)**. Le dashboard se connecte au WebSocket et affiche la posture en temps réel, les alertes et le graphique.

### 4. (Optionnel) Simulateur Wokwi

Voir le workflow détaillé ci-dessous.

---

## Workflow de lancement

### Scénario A : Sans simulateur (recommandé pour démarrer)

1. **Terminal 1 – Backend**
  `cd backend && npm install && npm run init-db && npm start`
2. **Terminal 2 – Gateway (mock)**
  `cd gateway && npm install && npm run mock`
3. **Terminal 3 – Frontend**
  `cd frontend && npm install && npm run dev`
4. Ouvrir **[http://localhost:5173](http://localhost:5173)** : le dashboard affiche les postures et alertes en temps réel (données générées par la gateway).

### Scénario B : Wokwi dans le navigateur (wokwi.com)

Le simulateur en ligne **n’envoie pas** les données vers ta machine. Deux options :

- **Option 1 – Gateway en mock** : lancer comme en scénario A. Le dashboard reçoit les données du générateur ; tu peux ouvrir Wokwi à part pour voir le même type de sortie Serial.
- **Option 2 – Copier-coller** : lancer backend + frontend (sans gateway). Sur [Wokwi](https://wokwi.com), créer un projet Arduino Uno, importer/coller le code de `embedded/smartposture.ino` et le `diagram.json` (Arduino + MPU6050 câblé). Démarrer la simulation, ouvrir le Serial Monitor (115200 baud) : des lignes JSON s’affichent. Copier des lignes et les envoyer au backend avec :
  ```bash
  curl -X POST http://localhost:3000/api/telemetry -H "Content-Type: application/json" -d '<coller une ligne JSON>'
  ```

Pour que le sketch envoie bien du JSON sous Wokwi : pas de `while (!Serial)` (il bloque dans le simulateur). Le fichier `embedded/smartposture.ino` est déjà corrigé.

### Scénario C : Wokwi for VS Code (TCP)

Pour que le Serial Monitor affiche le JSON et que la gateway reçoive les données en TCP :

1. Installer l’extension **Wokwi for VS Code** et **PlatformIO IDE** (ou CLI : `pip install platformio`) dans VS Code.
2. Ouvrir le dossier `**embedded/`** dans VS Code.
3. **Compiler le firmware** (obligatoire, sinon la simu ne lance pas le code) :
  ```bash
   cd embedded && pio run
  ```
4. **Démarrer la simulation** : F1 → « Wokwi: Start Simulator ». Le Serial Monitor doit afficher les lignes JSON.
5. **Lancer backend** (terminal 1) : `cd backend && npm start`
6. **Lancer la gateway en mode TCP** (terminal 2) : `cd gateway && npm run tcp`
7. **Lancer le frontend** (terminal 3) : `cd frontend && npm run dev` → ouvrir [http://localhost:5173](http://localhost:5173).

Sans l’étape 3, le port TCP 4000 s’ouvre mais aucun flux série n’est envoyé (pas de JSON dans le Serial Monitor).

---

## Livrables


| Livrable                         | Emplacement                                                                                                                                                                |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Diagramme de flux de données     | [docs/data-flow.md](docs/data-flow.md)                                                                                                                                     |
| Tableau des choix technologiques | [docs/technology-choices.md](docs/technology-choices.md)                                                                                                                   |
| Code source et instructions      | Ce dépôt (README, README de chaque module)                                                                                                                                 |
| Lien simulateur                  | [embedded/README.md](embedded/README.md) (à compléter avec l’URL du projet Wokwi)                                                                                          |
| Vidéo de démo (2–3 min)          | À enregistrer et héberger ; ajouter le lien ici.                                                                                                                           |
| Croquis gilet + justification    | [docs/vest-placement.md](docs/vest-placement.md), [docs/croquis_vue_de_face.png](docs/croquis_vue_de_face.png), [docs/croquis_vue_de_dos.png](docs/croquis_vue_de_dos.png) |


## Vidéo de démonstration

Lien vers la vidéo : [Youtube](https://youtu.be/MlCPoHRQxSU)