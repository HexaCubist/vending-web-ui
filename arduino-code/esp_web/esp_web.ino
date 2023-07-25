#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>
#include credentials.h

const char* ssid = SSID;
const char* password = PASSWORD;
const char* api_key = API_KEY;


//Your Domain name with URL path or IP address with path
String serverName = SERVERNAME;

// the following variables are unsigned longs because the time, measured in
// milliseconds, will quickly become a bigger number than can be stored in an int.
unsigned long lastTime = 0;
// Timer set to 10 minutes (600000)
//unsigned long timerDelay = 600000;
// Set timer to 5 seconds (5000)
unsigned long timerDelay = 2000;

StaticJsonDocument<768> doc;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  //!Serial.println("Connecting");
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    //!Serial.print(".");
  }
  //!Serial.println("");
  //!Serial.print("Connected to WiFi network with IP Address: ");
  //!Serial.println(WiFi.localIP());
 
  //!Serial.println("Timer set to 2 seconds (timerDelay variable), it will take 5 seconds before publishing the first reading.");
}

void loop() {
  // Send an HTTP POST request depending on timerDelay
  if ((millis() - lastTime) > timerDelay) {
    //Check WiFi connection status
    if(WiFi.status()== WL_CONNECTED){
      String payload = httpGETRequest(serverName + "api/auth/queue");
      if(!payload.isEmpty()) {
        // //!Serial.println(payload);
        DeserializationError error = deserializeJson(
          doc,
          payload
        );
        if (error) {
          //!Serial.print(F("deserializeJson() failed: "));
          //!Serial.println(error.f_str());
          return;
        }

        for (JsonObject item : doc.as<JsonArray>()) {
          const char* id = item["id"];
          int shelf_loc = item["shelf_loc"]; // 30, 30, 30, 30
          int quantity = item["quantity"]; // 1, 1, 1, 1
          char printcode[5];
          snprintf(printcode,5,"%02d%01d",min(shelf_loc,99), min(quantity,9));
          Serial.println(printcode);
          // //!Serial.print(F("Dispensing shelf loc:"));
          // //!Serial.print(shelf_loc);
          // //!Serial.print(F("x"));
          // //!Serial.println(quantity);
          // dispenseProductNum(shelf_loc, quantity);
          // Return that we have dispensed the product
          httpPOSTRequest(serverName + "api/auth/complete/" + id);
        }
      } else {
        //!Serial.println(F("Got weirdo response"));
      }
    }
  }
}


String httpGETRequest(const String url) {
  WiFiClient client;
  HTTPClient http;
    
  // Your IP address with path or Domain name with URL path 
  // http.useHTTP10(true);
  http.begin(client, url);
  
  // If you need Node-RED/server authentication, insert user and password below
  http.setAuthorization("API_KEY", API_KEY);
  
  // Send HTTP POST request
  int httpResponseCode = http.GET();
  
  String payload = "";
  
  if (httpResponseCode>0) {
    //!Serial.print("HTTP Response code: ");
    //!Serial.println(httpResponseCode);
    payload = http.getString();
  }
  else {
    //!Serial.print("Error code: ");
    //!Serial.println(httpResponseCode);
  }
  // Free resources
  http.end();
  //!Serial.println(payload);
  return payload;
}

String httpPOSTRequest(const String url) {
  WiFiClient client;
  HTTPClient http;
    
  // Your IP address with path or Domain name with URL path 
  //!Serial.println(url);
  http.begin(client, url);
  
  // If you need Node-RED/server authentication, insert user and password below
  http.setAuthorization("API_KEY", API_KEY);
  
  // Send HTTP POST request
  int httpResponseCode = http.POST("");
  
  String payload = "";
  
  if (httpResponseCode>0) {
    //!Serial.print("HTTP Response code: ");
    //!Serial.println(httpResponseCode);
    payload = http.getString();
  }
  else {
    //!Serial.print("Error code: ");
    //!Serial.println(httpResponseCode);
  }
  // Free resources
  http.end();

  return payload;
}


