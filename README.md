# SmartPosture – CorpSafe v1

POC complet d’un **gilet connecté d’analyse posturale** pour SafeWear Technologies : de la couche embarquée (simulateur) jusqu’au dashboard temps réel, en passant par la passerelle et le backend.

- **Objectif** : Détecter les mauvaises postures en temps réel, alerter (vibration prévue sur produit final) et fournir un dashboard HSE pour identifier zones ou tâches à risque.
- **Contraintes** : Aucun achat de composants ; tout le développement embarqué est réalisé sur simulateur (Wokwi ou Tinkercad).

## Architecture (3 couches IoT)

| Couche | Contenu |
|--------|--------|
| **Physique** | Microcontrôleur Arduino simulé, capteur MPU-6050 (accel + gyro) ou données simulées, sortie JSON sur Serial |
| **Passerelle** | Pont Node.js : Serial / WebSocket Wokwi / générateur mock → envoi HTTP ou MQTT vers le backend |
| **Cloud** | API REST + WebSocket, base SQLite, moteur de détection de posture (règles à seuils) |
| **Client** | Dashboard React (Vite) : posture temps réel, alertes, graphique d’évolution des angles |

## Dépôt

- **Documentation** : [docs/data-flow.md](docs/data-flow.md), [docs/technology-choices.md](docs/technology-choices.md), [docs/vest-placement.md](docs/vest-placement.md)
- **Croquis gilet** : [docs/vest-placement.svg](docs/vest-placement.svg)
- **Simulateur** : voir [embedded/README.md](embedded/README.md) ; après création du projet sur [Wokwi](https://wokwi.com/projects/new/arduino-uno), ajouter le lien partagé dans `embedded/README.md` et ici.

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

Ouvrir **http://localhost:5173**. Le dashboard se connecte au WebSocket et affiche la posture en temps réel, les alertes et le graphique.

### 4. (Optionnel) Simulateur Arduino

- Créer un projet sur [Wokwi](https://wokwi.com/projects/new/arduino-uno) et coller le code de [embedded/smartposture.ino](embedded/smartposture.ino).
- Pour envoyer les données au backend sans gateway : copier les lignes JSON du Serial Monitor et les poster manuellement (voir [gateway/README.md](gateway/README.md)).
- Avec une gateway en mode Serial : configurer `SERIAL_PORT` et lancer `npm run serial` (après avoir identifié le port du simulateur, si disponible).

## Livrables

| Livrable | Emplacement |
|----------|-------------|
| Diagramme de flux de données | [docs/data-flow.md](docs/data-flow.md) |
| Tableau des choix technologiques | [docs/technology-choices.md](docs/technology-choices.md) |
| Code source et instructions | Ce dépôt (README, README de chaque module) |
| Lien simulateur | [embedded/README.md](embedded/README.md) (à compléter avec l’URL du projet Wokwi) |
| Vidéo de démo (2–3 min) | À enregistrer et héberger ; ajouter le lien ici. |
| Croquis gilet + justification | [docs/vest-placement.md](docs/vest-placement.md), [docs/vest-placement.svg](docs/vest-placement.svg) |

## Vidéo de démonstration

_À compléter après enregistrement :_

1. Lancer le backend, la gateway (mock) et le frontend.
2. Montrer le dashboard : posture en temps réel, passage en « Attention » / « Alerte » lorsque le générateur simule une mauvaise posture.
3. Montrer les alertes et le graphique d’évolution des angles.

Lien vers la vidéo : _[à ajouter]_

## Licence

Projet POC – SafeWear Technologies.
