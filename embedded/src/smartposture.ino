#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>
#include <math.h>

Adafruit_MPU6050 mpu1; // capteur haut du dos
Adafruit_MPU6050 mpu2; // capteur bas du dos

// Moteur de vibration (PWM) : léger en WARNING, fort en BAD_POSTURE
#define VIBRATION_PIN 9
#define VIBRATION_OFF     0   // bonne posture
#define VIBRATION_WARNING 80  // vibration légère
#define VIBRATION_BAD     255 // vibration forte

// Buzzer (simulation sonore en Wokwi) : discret en WARNING, fort en BAD_POSTURE
#define BUZZER_PIN 8
#define TONE_WARNING 700   // Hz — son discret
#define TONE_BAD     1500  // Hz — son plus fort / urgent

// Sonde de température (LM35 ou TMP36 sur A0 — 10 mV/°C, 0°C = 0 V)
#define TEMP_PIN A0
// Cycle type Deep Sleep : un envoi toutes les 10 s (sur ESP32 on utiliserait esp_deep_sleep)
#define WAKE_INTERVAL_MS 10000

void setup(void) {
  Serial.begin(115200);
  pinMode(VIBRATION_PIN, OUTPUT);
  analogWrite(VIBRATION_PIN, VIBRATION_OFF);
  pinMode(BUZZER_PIN, OUTPUT);
  noTone(BUZZER_PIN);

  if (!mpu1.begin(0x68)) { while (1) yield(); }
  if (!mpu2.begin(0x69)) { while (1) yield(); }
  
  mpu1.setAccelerometerRange(MPU6050_RANGE_2_G);
  mpu2.setAccelerometerRange(MPU6050_RANGE_2_G);
}

void printData(sensors_event_t &a, sensors_event_t &g) {
  Serial.print("\"accX\":"); Serial.print(a.acceleration.x, 2);
  Serial.print(",\"accY\":"); Serial.print(a.acceleration.y, 2);
  Serial.print(",\"accZ\":"); Serial.print(a.acceleration.z, 2);
  Serial.print(",\"gyrX\":"); Serial.print(g.gyro.x, 2);
  Serial.print(",\"gyrY\":"); Serial.print(g.gyro.y, 2);
  Serial.print(",\"gyrZ\":"); Serial.print(g.gyro.z, 2);
}

void loop() {
  sensors_event_t a1, g1, t1;
  sensors_event_t a2, g2, t2;

  unsigned long timestamp = millis();
  mpu1.getEvent(&a1, &g1, &t1);
  mpu2.getEvent(&a2, &g2, &t2);

  float pitchHigh = atan2(-a1.acceleration.x, sqrt(pow(a1.acceleration.y, 2) + pow(a1.acceleration.z, 2))) * 180.0 / M_PI;
  float rollHigh  = atan2(a1.acceleration.y, a1.acceleration.z) * 180.0 / M_PI;
  
  float pitchLow  = atan2(-a2.acceleration.x, sqrt(pow(a2.acceleration.y, 2) + pow(a2.acceleration.z, 2))) * 180.0 / M_PI;
  float rollLow   = atan2(a2.acceleration.y, a2.acceleration.z) * 180.0 / M_PI;

  // Activite : moyenne des 2 capteurs pour que le 2e soit aussi controllable
  float pitchAvg = (pitchHigh + pitchLow) * 0.5f;
  float rollAvg  = (rollHigh + rollLow) * 0.5f;
  float accZ_g   = (a1.acceleration.z + a2.acceleration.z) * 0.5f / 9.81f;

  String activity = "UNKNOWN";
  if (abs(pitchAvg) < 15 && abs(rollAvg) < 15) {
    activity = "STAND_UP";
  } else if ((pitchAvg > 50 && pitchAvg < 130) || (rollAvg > 50 && rollAvg < 130)) {
    activity = "SIT_DOWN";
  } else if (abs(pitchAvg) > 60 || accZ_g < 0.3f) {
    activity = "LAY_DOWN";
  }

  // Différence d’angle entre haut du dos (capteur droit) et bas du dos (capteur gauche)
  // Les deux capteurs ont ainsi un effet sur la posture.
  // Difference pitch + roll entre les 2 capteurs — les deux ont un effet direct
  float deltaPitch = abs(pitchHigh + pitchLow);
  float deltaRoll  = abs(rollHigh + rollLow);
  float deltaAngle = sqrt(deltaPitch * deltaPitch + deltaRoll * deltaRoll);
  String posture = "GOOD_POSTURE";

  float warningFloor = 27;
  float badPostureFloor = 50;


  if (deltaAngle > warningFloor) {
    posture = "WARNING";
  }

  if (deltaAngle > badPostureFloor) {
    posture = "BAD_POSTURE";
  }

  // Contrôle du moteur de vibration
  if (posture == "BAD_POSTURE") {
    analogWrite(VIBRATION_PIN, VIBRATION_BAD);
    tone(BUZZER_PIN, TONE_BAD);  // son fort en simulation
  } else if (posture == "WARNING") {
    analogWrite(VIBRATION_PIN, VIBRATION_WARNING);
    tone(BUZZER_PIN, TONE_WARNING);  // son discret en simulation
  } else {
    analogWrite(VIBRATION_PIN, VIBRATION_OFF);
    noTone(BUZZER_PIN);
  }

  Serial.print("{");
  Serial.print("\"id\":\"gilet_01\"");
  Serial.print(",\"timestamp\":"); Serial.print(timestamp);
  Serial.print(",\"activity\":\""); Serial.print(activity); Serial.print("\"");
  Serial.print(",\"posture\":\""); Serial.print(posture); Serial.print("\"");
  Serial.print(",\"angle_diff\":"); Serial.print(deltaAngle, 2);
  
  Serial.print(",\"sensorHigh\":{"); printData(a1, g1); Serial.print("}");
  Serial.print(",\"sensorLow\":{"); printData(a2, g2); Serial.print("}");

  // Température : lecture analogique A0 (LM35/TMP36), conversion en °C
  int raw = analogRead(TEMP_PIN);
  float voltage = (raw / 1023.0) * 5.0;
  float tempC = (voltage - 0.5) * 100.0;  // TMP36: 0.5 V à 0°C
  // LM35: tempC = voltage * 100.0;
  Serial.print(",\"temperature\":"); Serial.print(tempC, 1);
  Serial.print(",\"status\":\"up\"");  // up tant que le processeur est en marche
  Serial.println("}");

  // Réveil toutes les 10 s (simule Deep Sleep sur ESP32)
  delay(WAKE_INTERVAL_MS);
}