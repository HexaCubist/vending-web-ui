#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>
#include "credentials.h"   // FIX: was missing quotes — invalid C++

const char* ssid = SSID;
const char* password = PASSWORD;
const char* api_key = API_KEY;

// Your Domain name with URL path or IP address with path
String serverName = SERVERNAME;

unsigned long lastTime = 0;
// Poll every 5s. Was 2s — that's 43k calls/day, more than needed.
unsigned long timerDelay = 5000;

// JSON buffer for the queue payload. Was StaticJsonDocument<768> — far too small.
// Each queue item is ~120 bytes (PI id alone is 27 chars). 768 bytes silently
// fails to parse once the queue exceeds ~5 items.
// 4096 fits ~30 items. Heap-allocated (ESP8266 has ~50KB free heap).
DynamicJsonDocument doc(4096);

// Track recently-completed PI IDs so we don't double-dispense if the queue
// endpoint hasn't yet reflected our most recent /complete call.
const int RECENT_SIZE = 8;
String recentlyCompleted[RECENT_SIZE];
unsigned long recentlyCompletedAt[RECENT_SIZE];
int recentIdx = 0;

bool wasRecentlyCompleted(const String& id) {
  unsigned long now = millis();
  for (int i = 0; i < RECENT_SIZE; i++) {
    if (recentlyCompleted[i] == id && (now - recentlyCompletedAt[i]) < 60000UL) {
      return true;
    }
  }
  return false;
}

void markCompleted(const String& id) {
  recentlyCompleted[recentIdx] = id;
  recentlyCompletedAt[recentIdx] = millis();
  recentIdx = (recentIdx + 1) % RECENT_SIZE;
}

// Wait for the Uno to confirm the dispense over Serial.
// Uno sends "<OK" on success, "<ERR" on failure. Returns true only on <OK.
bool waitForUnoAck(unsigned long timeoutMs) {
  unsigned long start = millis();
  String line = "";
  while (millis() - start < timeoutMs) {
    while (Serial.available()) {
      char c = Serial.read();
      if (c == '\n' || c == '\r') {
        line.trim();
        if (line == "<OK") return true;
        if (line.startsWith("<ERR")) return false;
        line = "";
      } else {
        line += c;
        if (line.length() > 32) line = "";  // bail on garbage
      }
    }
    delay(10);
    yield();  // feed the watchdog
  }
  return false;
}

void connectWifi() {
  WiFi.begin(ssid, password);
  unsigned long start = millis();
  // 30 second cap so we don't hang forever on boot
  while (WiFi.status() != WL_CONNECTED && (millis() - start) < 30000UL) {
    delay(500);
    yield();
  }
}

void setup() {
  Serial.begin(115200);
  delay(100);
  // Debug lines start with '#' — Uno is configured to ignore those.
  Serial.println("# ESP boot");
  connectWifi();
}

void loop() {
  if ((millis() - lastTime) > timerDelay) {
    lastTime = millis();

    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("# WiFi reconnecting");
      connectWifi();
      return;
    }

    String payload = httpGETRequest(serverName + "api/auth/queue");
    if (payload.isEmpty()) return;

    doc.clear();
    DeserializationError err = deserializeJson(doc, payload);
    if (err) {
      // FIX: was silently swallowed. Now visible (Uno ignores '#' lines).
      Serial.print("# json parse failed: ");
      Serial.println(err.f_str());
      return;
    }

    for (JsonObject item : doc.as<JsonArray>()) {
      const char* id = item["id"];
      int shelf_loc = item["shelf_loc"];
      int quantity = item["quantity"];
      if (!id) continue;

      String idStr(id);
      if (wasRecentlyCompleted(idStr)) {
        // Already completed — queue endpoint just hasn't caught up yet.
        continue;
      }

      // Send dispense command to Uno. Prefix '>' so Uno ignores debug lines.
      char cmd[8];
      snprintf(cmd, sizeof(cmd), ">%02d%01d", min(shelf_loc, 99), min(quantity, 9));
      Serial.println(cmd);

      // Wait up to 10s for Uno to confirm. If it times out, leave the item in
      // the queue — next poll will retry. Critically, we DO NOT call /complete
      // unless the Uno confirmed dispense.
      if (!waitForUnoAck(10000)) {
        Serial.println("# uno ack timeout, will retry next poll");
        continue;
      }

      // Now (and only now) tell the server we dispensed it. This is what
      // captures the customer's card.
      httpPOSTRequest(serverName + "api/auth/complete/" + id);
      markCompleted(idStr);

      // Pace between items so the Uno's serial RX buffer doesn't overflow.
      delay(500);
    }
  }
}


String httpGETRequest(const String url) {
  WiFiClient client;
  HTTPClient http;
  http.setTimeout(8000);
  http.begin(client, url);
  // Bearer auth — server now actually checks this.
  http.addHeader("Authorization", String("Bearer ") + api_key);

  int httpResponseCode = http.GET();

  String payload = "";
  if (httpResponseCode > 0) {
    payload = http.getString();
  } else {
    Serial.print("# GET err: ");
    Serial.println(httpResponseCode);
  }
  http.end();
  return payload;
}

String httpPOSTRequest(const String url) {
  WiFiClient client;
  HTTPClient http;
  http.setTimeout(8000);
  http.begin(client, url);
  http.addHeader("Authorization", String("Bearer ") + api_key);

  int httpResponseCode = http.POST("");

  String payload = "";
  if (httpResponseCode > 0) {
    payload = http.getString();
  } else {
    Serial.print("# POST err: ");
    Serial.println(httpResponseCode);
  }
  http.end();
  return payload;
}
