#define VRX_PIN A0
#define VRY_PIN A1
#define SW_PIN 11

#include "pitches.h"

int melody[] = {
  NOTE_C4, NOTE_G3, NOTE_G3, NOTE_A3, NOTE_G3, 0, NOTE_B3, NOTE_C4
};

// note durations: 4 = quarter note, 8 = eighth note, etc.:
int noteDurations[] = {
  4, 8, 8, 4, 4, 4, 4, 4
};

const int redPin = 12;


int buttonState = 0;

int joyX = 0, joyY = 0, sw = 0;

const int numReadings = 10;

int xReadings[numReadings];  // the readings from the analog input
int yReadings[numReadings];
int readIndex = 0;          // the index of the current reading
float xTotal = 0, yTotal = 0;              // the running total
float xAverage = 0, yAverage = 0;            // the average
float xStart, yStart;
bool start = false;
unsigned long lastTime = 0;
const int interval = 16;

void setup() {
  Serial.begin(57600);
  pinMode(SW_PIN, INPUT_PULLUP);

  pinMode(redPin, OUTPUT);

  for(int i = 0; i < numReadings; i++) {
    xReadings[i] = 0;
    yReadings[i] = 0;
  }
}

void loop() {

// if there's any serial available, read it:
  while (Serial.available() > 0) {

    char command = Serial.read();

    switch (command) {
      case 'R': // Turn on red LED
        digitalWrite(redPin, HIGH);
        break;
      case 'O': // Turn off all LEDs
        digitalWrite(redPin, LOW);
        break;
      case 'M': // 
        playMelody();
    }
  
  }
  
  int x = analogRead(VRX_PIN);
  int y = analogRead(VRY_PIN);
  int sw = digitalRead(SW_PIN);

  xTotal = xTotal - xReadings[readIndex];
  yTotal = yTotal - yReadings[readIndex];
  // read from the sensor:
  xReadings[readIndex] = x;
  yReadings[readIndex] = y;
  // add the reading to the total:
  xTotal = xTotal + x;
  yTotal = yTotal + y;
  // advance to the next position in the array:
  readIndex = readIndex + 1;

  // calculate the average:
  xAverage = xTotal / numReadings;
  yAverage = yTotal / numReadings;

  // if we're at the end of the array...
  if (readIndex >= numReadings) {
    // ...wrap around to the beginning:
    readIndex = 0;
    if (!start) {
      xStart = xAverage;
      yStart = yAverage;
      start = true;
    }
  }

  if (start) {
    unsigned long now = millis();
    if (now - lastTime > interval) {
      //Serial.print("x = ");
      Serial.print((int) (xAverage-xStart));
      Serial.print(",");
      Serial.print((int) (yAverage-yStart));
      Serial.print(",");
      Serial.println(!sw);
    
      lastTime = now;
    }

  }
}

void playMelody() {
  // Define your melody and note durations here
  int melody[] = {NOTE_C4, NOTE_G3, NOTE_G3, NOTE_A3, NOTE_G3, 0, NOTE_B3, NOTE_C4};
  int noteDurations[] = {4, 8, 8, 4, 4, 4, 4, 4};

  // iterate over the notes of the melody:
  for (int thisNote = 0; thisNote < 8; thisNote++) {
    // to calculate the note duration, take one second divided by the note type.
    // e.g. quarter note = 1000 / 4, eighth note = 1000/8, etc.
    int noteDuration = 1000 / noteDurations[thisNote];
    tone(8, melody[thisNote], noteDuration);

    // to distinguish the notes, set a minimum time between them.
    // the note's duration + 30% seems to work well:
    int pauseBetweenNotes = noteDuration * 1.30;
    delay(pauseBetweenNotes);
    // stop the tone playing:
    noTone(8);
  }
}
