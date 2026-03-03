# Collections MongoDB (SmartPosture backend)

Le backend utilise deux collections dans la base configurée par `MONGODB_URI` (nom de base par défaut : `smartposture`).

## telemetry

Télémétrie brute (accéléromètre, gyroscope) envoyée par la gateway.

| Champ        | Type   | Description                    |
|-------------|--------|--------------------------------|
| device_id   | string | Identifiant appareil           |
| operator_id | string | Identifiant opérateur (optionnel) |
| zone        | string | Zone / poste (optionnel)      |
| accel_x     | number | Accélération axe X (g)         |
| accel_y     | number | Accélération axe Y             |
| accel_z     | number | Accélération axe Z             |
| gyro_x      | number | Vitesse angulaire X            |
| gyro_y      | number | Vitesse angulaire Y            |
| gyro_z      | number | Vitesse angulaire Z            |
| ts          | number | Timestamp (ms)                 |
| created_at  | Date   | Date d’insertion               |

Index : `ts` (desc), `device_id`.

## posture_events

Événements d’alerte posture (mauvaise posture détectée).

| Champ             | Type   | Description              |
|-------------------|--------|--------------------------|
| device_id         | string | Identifiant appareil     |
| operator_id       | string | Identifiant opérateur    |
| zone              | string | Zone / poste             |
| posture_type      | string | Ex. `bent_forward`, `lateral_tilt` |
| severity          | string | `warning` ou `alert`     |
| tilt_forward_deg  | number | Angle inclinaison avant (°) |
| tilt_lateral_deg  | number | Angle inclinaison latérale (°) |
| ts                | number | Timestamp (ms)           |
| created_at        | Date   | Date d’insertion         |

Index : `ts` (desc), `device_id`.
