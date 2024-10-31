#include <Wire.h>
#include <VL53L1X.h>
#include <HardwareSerial.h>
#include <STM32FreeRTOS.h>

VL53L1X sensor;
HardwareSerial Serial1(PA10, PB6);

const int sensorPin = D4;
byte indicator = LED_BUILTIN;

volatile bool isAlarmed = true;

// Task Handles
TaskHandle_t pirTaskHandle;
TaskHandle_t blinkTaskHandle;

// Tasks for containing sensors
void vPirTask(void *pvParameters){
  UNUSED(pvParameters);
  pinMode(sensorPin, INPUT);
  attachInterrupt(digitalPinToInterrupt(sensorPin), pirActivated, RISING);

  while(1){
    if(isAlarmed){
        ulTaskNotifyTake(pdTRUE, portMAX_DELAY);

        sensor.startContinuous(100);
        if (sensor.read() <= 2000){
        Serial.println("Intruder!");
        Serial1.print(1);
        }
        sensor.stopContinuous();

        vTaskDelay(500 / portTICK_PERIOD_MS);
    }
  }
}

// Blinks given alarm is armed
void vBlinkTask(void *pvParameters){
  UNUSED(pvParameters);
  pinMode(indicator, OUTPUT);

  while(1){
    if(isAlarmed){
      digitalWrite(indicator, HIGH);
      vTaskDelay(300 / portTICK_PERIOD_MS);
      digitalWrite(indicator, LOW);
      vTaskDelay(300 / portTICK_PERIOD_MS);
    } else {
      digitalWrite(indicator, LOW);
    }
    vTaskDelay(100 / portTICK_PERIOD_MS);
  }
}

// Detects rising state on D4 Pin
void pirActivated() {
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;
    vTaskNotifyGiveFromISR(pirTaskHandle, &xHigherPriorityTaskWoken);
    portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
}

void setup() {
  Serial.begin(9600);
  Serial1.begin(115200);

  Wire.begin();
  Wire.setClock(400000); // use 400 kHz I2C

  sensor.setTimeout(500);
  if (!sensor.init()) {
      Serial.println("Failed to detect and initialize sensor!");
      while (1); 
  }

  sensor.setDistanceMode(VL53L1X::Long);
  sensor.setMeasurementTimingBudget(50000);  // Set timing budget to 50 ms

  xTaskCreate(vPirTask, "PIR Task", configMINIMAL_STACK_SIZE + 200, NULL, 2, &pirTaskHandle);
  xTaskCreate(vBlinkTask, "Blink Task", configMINIMAL_STACK_SIZE + 100, NULL, 1, &blinkTaskHandle);

  // Start the FreeRTOS scheduler
  vTaskStartScheduler();
}

void loop() {
  // put your main code here, to run repeatedly:

}
