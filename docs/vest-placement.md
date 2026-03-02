# Placement du microcontrôleur et du capteur sur le gilet

## Recommandation d’emplacement

L’unité électronique (microcontrôleur + capteur(s) MPU-6050) est positionnée au **haut du dos, entre les omoplates**, au centre du gilet. Le montage peut utiliser **deux** MPU-6050 (même bus I2C, adresses 0x68 et 0x69) pour améliorer la précision.

**Placement des 2 capteurs sur le corps (recommandé)** :
- **Capteur 1 (I2C 0x68)** : **entre les omoplates**, au centre du haut du dos — mesure l’inclinaison du haut du tronc.
- **Capteur 2 (I2C 0x69)** : **région lombaire** (bas du dos), le long de la colonne — mesure l’inclinaison du bas du tronc et complète la détection de flexion (dos courbé).

Les deux positions (omoplates + lombaires) permettent de mieux capturer la posture du tronc (flexion avant, inclinaison latérale) tout en limitant les artefacts. Le firmware fusionne les mesures (moyenne) avant envoi ; le câblage I2C peut longer le dos entre les deux capteurs.

### Justification

- **Représentativité de la posture** : Le tronc est la référence pour les TMS (flexion, inclinaison latérale, torsion). Un capteur au dos mesure directement l’orientation du torse par rapport à la gravité.
- **Limitation des artefacts** : Un placement sur le bras ou le torse avant serait plus sensible aux mouvements des membres. Le haut du dos reste stable pour les tâches de manutention typiques.
- **Confort** : Une poche dédiée ou une bande élastique entre les omoplates limite le contact avec la peau et évite les points de pression. Le câblage peut longer la colonne vers une poche batterie en bas de dos ou sur le côté.
- **Orientation des axes** : Pour une interprétation cohérente, l’axe Z du MPU-6050 est aligné avec la verticale (vers le haut) lorsque l’opérateur est debout. X et Y permettent alors de dériver l’inclinaison avant/arrière et latérale.

## Croquis

Le fichier [vest-placement.svg](./vest-placement.svg) illustre la vue arrière du gilet avec :

- L’emplacement du boîtier (rectangle entre les omoplates).
- L’orientation schématique des axes du capteur (X, Y, Z).
- Éventuellement le trajet du câble vers l’alimentation / module Bluetooth.

## Référence pour le firmware

Dans le code embarqué et le moteur de détection, les angles sont dérivés en supposant :

- **Z** ≈ 1 g vers le haut en posture debout.
- **Inclinaison avant/arrière** : principalement portée par l’axe X après rotation.
- **Inclinaison latérale** : portée par l’axe Y.

Un calibrage « debout neutre » au premier allumage peut améliorer la précision en environnement réel.
