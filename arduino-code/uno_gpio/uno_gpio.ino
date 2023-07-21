const int PINNUM_1 = 1;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200); 
  for (int i = 0; i < 10; i++) {
    pinMode(PINNUM_1 + i, OUTPUT);
    digitalWrite(PINNUM_1 + i, HIGH);
  }
}

void loop() {
  // put your main code here, to run repeatedly:
  while (Serial.available() == 0) {}
  String command = Serial.readStringUntil('\n');
  command.trim();
  if(command.length() > 0) {
    // Serial.println("Started parsing:" + command + ":");
    int product = command.substring(0,2).toInt();
    int quantity = command.substring(2,3).toInt();
    dispenseProductNum(product,quantity);
  }
  Serial.flush();
}


void dispenseProductNum(int shelf_loc, int quantity) {
  // Loop over quantity
  for (int i = 0; i < quantity; i++) {
    dispenseProduct(shelf_loc);
    delay(1000);
  }
}

void dispenseProduct(int shelf_loc) {
  // Type out the shelf location on the keypad
  const int firstDigit = max(min(shelf_loc / 10,9),1);
  const int secondDigit = max(min(shelf_loc % 10,9),1);
  digitalWrite(PINNUM_1 - 1 + firstDigit, LOW);
  delay(500);
  digitalWrite(PINNUM_1 - 1 + firstDigit, HIGH);
  delay(500);
  digitalWrite(PINNUM_1 - 1 + secondDigit, LOW);
  delay(500);
  digitalWrite(PINNUM_1 - 1 + secondDigit, HIGH);
  delay(500);
}
