/*
 * SmartPosture / CorpSafe v1 - Simulation MPU-6050
 * Gilet intelligent d'analyse posturale - Données accéléromètre & gyroscope
 *
 * Si MPU-6050 disponible : lecture I2C réelle.
 * Sinon : génération de données réalistes simulées (sin/cos + bruit).
 * Sortie : JSON sur Serial à ~5 Hz pour pont gateway.
 */

// Décommenter si MPU-6050 présent dans le simulateur (Wokwi)
#define USE_MPU6050

#ifdef USE_MPU6050
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

Adafruit_MPU6050 mpu1;  // I2C 0x68 (AD0 à GND)
Adafruit_MPU6050 mpu2;  // I2C 0x69 (AD0 à VCC)
#else
// Simulation : pas de lib externe
#endif

const unsigned long SEND_INTERVAL_MS = 200;  // 5 Hz
unsigned long lastSend = 0;

// Pour simulation réaliste : phase et bruit
float phase = 0.0f;
const float PHASE_STEP = 0.05f;

void setup() {
  Serial.begin(115200);
  // Ne pas utiliser while(!Serial) : bloque indéfiniment dans le simulateur Wokwi
  delay(100);

#ifdef USE_MPU6050
  if (!mpu1.begin(0x68)) {
    Serial.println("{\"error\":\"MPU6050 #1 (0x68) not found\"}");
    while (1) delay(10);
  }
  if (!mpu2.begin(0x69)) {
    Serial.println("{\"error\":\"MPU6050 #2 (0x69) not found\"}");
    while (1) delay(10);
  }
  mpu1.setAccelerometerRange(MPU6050_RANGE_2_G);
  mpu1.setGyroRange(MPU6050_RANGE_250_DEG);
  mpu1.setFilterBandwidth(MPU6050_BAND_21_HZ);
  mpu2.setAccelerometerRange(MPU6050_RANGE_2_G);
  mpu2.setGyroRange(MPU6050_RANGE_250_DEG);
  mpu2.setFilterBandwidth(MPU6050_BAND_21_HZ);
#else
  randomSeed(analogRead(0));
#endif
}

void loop() {
  if (millis() - lastSend < SEND_INTERVAL_MS)
    return;
  lastSend = millis();

  float ax, ay, az, gx, gy, gz;

#ifdef USE_MPU6050
  sensors_event_t a1, g1, temp1, a2, g2, temp2;
  mpu1.getEvent(&a1, &g1, &temp1);
  mpu2.getEvent(&a2, &g2, &temp2);
  ax = (a1.acceleration.x + a2.acceleration.x) / 2.f;
  ay = (a1.acceleration.y + a2.acceleration.y) / 2.f;
  az = (a1.acceleration.z + a2.acceleration.z) / 2.f;
  gx = ((g1.gyro.x + g2.gyro.x) / 2.f) * 57.2958f;  // rad/s -> deg/s
  gy = ((g1.gyro.y + g2.gyro.y) / 2.f) * 57.2958f;
  gz = ((g1.gyro.z + g2.gyro.z) / 2.f) * 57.2958f;
#else
  // Données simulées : posture debout légèrement variable + bruit
  // Accel en g : Z ≈ 1 (gravité), X/Y ≈ 0 au repos
  float noise = 0.02f;
  ax = 0.02f * cos(phase)      + (random(-100, 100) / 1000.0f) * noise;
  ay = 0.01f * sin(phase * 0.7f) + (random(-100, 100) / 1000.0f) * noise;
  az = 0.98f + 0.02f * sin(phase * 0.3f) + (random(-100, 100) / 1000.0f) * noise;
  gx = (random(-50, 50) / 10.0f);  // deg/s
  gy = (random(-50, 50) / 10.0f);
  gz = (random(-30, 30) / 10.0f);
  phase += PHASE_STEP;
  if (phase > 6.28318f) phase -= 6.28318f;
#endif

  // JSON une ligne pour parsing facile côté gateway (moyenne 2 capteurs)
  Serial.print("{\"accel\":{\"x\":");
  Serial.print(ax, 4);
  Serial.print(",\"y\":");
  Serial.print(ay, 4);
  Serial.print(",\"z\":");
  Serial.print(az, 4);
  Serial.print("},\"gyro\":{\"x\":");
  Serial.print(gx, 2);
  Serial.print(",\"y\":");
  Serial.print(gy, 2);
  Serial.print(",\"z\":");
  Serial.print(gz, 2);
  Serial.print("},\"ts\":");
  Serial.print(millis());
  Serial.print(",\"sensors\":2}");
  Serial.println();
}
