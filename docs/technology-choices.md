# Tableau des choix technologiques – SmartPosture POC

| Domaine | Choix retenu | Justification |
|--------|--------------|----------------|
| **Simulateur** | Wokwi | Support du port série et possibilité de partager un lien de projet. WebSocket possible pour une connexion automatique au Serial Monitor. Alternative : Tinkercad. |
| **Embarqué** | Arduino (C++) | Compatible Wokwi/Tinkercad, librairie Wire pour I2C (MPU-6050). Si le MPU-6050 n’est pas disponible dans le simulateur, génération de données réalistes dans le sketch. |
| **Transmission** | Mode auto-test + pont Serial | Le mode mock (générateur dans la gateway) permet de développer backend et frontend sans matériel. Le pont Serial permet la démo avec le simulateur ; WebSocket Wokwi en option. |
| **Broker / messaging** | HTTP POST ou MQTT (Eclipse Mosquitto) | MQTT pour découplage et montée en charge multi-appareils. HTTP POST direct vers l’API pour un POC minimal sans broker. |
| **Backend** | Node.js (Express) | Un seul langage (JS) pour gateway et backend, WebSocket natif, écosystème npm. |
| **API** | REST (ingestion) + WebSocket (temps réel) | REST pour l’ingestion des télémetries et la consultation (santé, historique). WebSocket pour le flux temps réel vers le dashboard. |
| **Base de données** | SQLite | POC simple, sans déploiement serveur. Schéma : `telemetry`, `posture_events`. PostgreSQL possible pour un déploiement multi-environnement. |
| **Détection posture** | Règles à seuils (accel/gyro) | Pas de ML pour le POC : angles dérivés des axes (inclinaison avant/arrière, latérale), seuils « warning » et « alert », durée maintenue pour confirmer une alerte. |
| **Frontend** | React + Vite | Composants réutilisables, intégration WebSocket et graphiques (Recharts). Dashboard : vue temps réel + graphique d’évolution des angles. |
| **Hébergement local** | Docker Compose (optionnel) | Conteneur pour le broker MQTT si besoin ; backend et frontend en local (Node + Vite). |
