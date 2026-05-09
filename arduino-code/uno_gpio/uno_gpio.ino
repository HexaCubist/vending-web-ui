// Pin layout: digit "N" maps to digital pin (FIRST_PIN - 1 + N) for N in 1..9.
// FIRST_PIN was 1, but pin 1 is the hardware Serial TX pin — using it as a
// digital output prevented the Uno from ever sending data back to the ESP,
// and was a footgun if anyone added Serial debug output.
const int FIRST_PIN = 2;

void setup() {
  Serial.begin(115200);
  // Configure pins for digits 1..9 (pins 2..10).
  for (int i = 0; i < 9; i++) {
    pinMode(FIRST_PIN + i, OUTPUT);
    digitalWrite(FIRST_PIN + i, HIGH);  // active-low keypad: HIGH = released
  }
  delay(100);
}

void loop() {
  while (Serial.available() == 0) {}
  String command = Serial.readStringUntil('\n');
  command.trim();

  // Ignore anything not prefixed with '>'. The ESP sends debug lines starting
  // with '#' and ack lines start with '<' — we drop everything that's not a
  // dispense command, so debug output can flow through Serial harmlessly.
  if (!command.startsWith(">") || command.length() < 4) {
    Serial.flush();
    return;
  }
  command = command.substring(1);  // strip the '>'

  int product = command.substring(0, 2).toInt();
  int quantity = command.substring(2, 3).toInt();

  if (dispenseProductNum(product, quantity)) {
    Serial.println("<OK");
  } else {
    Serial.println("<ERR");
  }
  Serial.flush();
}


// Returns true if the dispense routine completed, false if the request was
// invalid (caller should leave the item in the queue and surface the error).
bool dispenseProductNum(int shelf_loc, int quantity) {
  if (quantity < 1 || quantity > 9) return false;
  if (shelf_loc < 11 || shelf_loc > 99) return false;
  // Reject any shelf with a 0 in it. The hardware can't press digit 0
  // (pins 2..10 only cover digits 1..9), so previously the code clamped
  // 0 -> 1 and silently dispensed the WRONG ITEM. Better to fail loudly.
  if ((shelf_loc / 10) == 0 || (shelf_loc % 10) == 0) return false;

  for (int i = 0; i < quantity; i++) {
    dispenseProduct(shelf_loc);
    delay(1000);
  }
  return true;
}

void dispenseProduct(int shelf_loc) {
  // Type out the shelf location on the keypad
  const int firstDigit = shelf_loc / 10;
  const int secondDigit = shelf_loc % 10;
  digitalWrite(FIRST_PIN - 1 + firstDigit, LOW);
  delay(500);
  digitalWrite(FIRST_PIN - 1 + firstDigit, HIGH);
  delay(500);
  digitalWrite(FIRST_PIN - 1 + secondDigit, LOW);
  delay(500);
  digitalWrite(FIRST_PIN - 1 + secondDigit, HIGH);
  delay(500);
}
