#include "esp_camera.h"

#define LED_BUILTIN  2

#define CAMERA_MODEL_WROVER_KIT
#include "camera_pins.h"

#include <HardwareSerial.h>

camera_config_t config;
HardwareSerial SerialPort(1);

bool activated = false;

void camera_init();

void setup() {
  Serial.begin(9600);
  Serial.setDebugOutput(true);
  Serial.println("Starting setup...");

  SerialPort.begin(115200, SERIAL_8N1, 32, 33);

  pinMode(LED_BUILTIN, OUTPUT);

  camera_init();

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
    return;
  }

  Serial.println("Camera initialized");

  sensor_t * s = esp_camera_sensor_get();
  s->set_vflip(s, 0);
  s->set_hmirror(s, 0);
  s->set_brightness(s, 1);
  s->set_saturation(s, -1);

  Serial.println("Camera settings applied");
}

void loop() {

  if (Serial.available() > 0) {
    char inputValue = Serial.read();

    if (inputValue == '2') {
      activated = true;

    } else if (inputValue == '3') {
      activated = false;
      digitalWrite(LED_BUILTIN, LOW);
    }
  }

  if (activated) {

    if (SerialPort.available()) {
      char incomingByte = SerialPort.read();
      if (incomingByte == '1') {
        take_photo();
        
        delay(2000);
      }
    }

    digitalWrite(LED_BUILTIN, HIGH);
    delay(1000);
    digitalWrite(LED_BUILTIN, LOW);
    delay(1000);
  }
  else {
    if (SerialPort.available()){
      SerialPort.read();
    }
  }

}

void camera_init() {
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.frame_size = FRAMESIZE_QVGA;
  config.pixel_format = PIXFORMAT_JPEG;
  config.grab_mode = CAMERA_GRAB_LATEST;
  config.fb_location = CAMERA_FB_IN_PSRAM;
  config.jpeg_quality = 10;
  config.fb_count = 2;
}

void take_photo() {
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Failed to capture image");
    return;
  }
  Serial.printf("%d\n", fb->len);
  Serial.write(fb->buf, fb->len);
  Serial.println("Image sent");
  esp_camera_fb_return(fb);
}
