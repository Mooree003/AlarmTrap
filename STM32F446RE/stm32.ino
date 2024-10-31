#include <Wire.h>
#include <VL53L1X.h>
#include <HardwareSerial.h>
#include <STM32FreeRTOS.h>

VL53L1X sensor;
HardwareSerial Serial1(PC11, PC10);

const int sensorPin = D4;
byte indicator = LED_BUILTIN;

volatile bool isAlarmed = true;

// Task Handles
TaskHandle_t pirTaskHandle;
TaskHandle_t blinkTaskHandle;
TaskHandle_t receiveTaskHandle;

// SemaphoreHandle_t xLock;

void vPirTask(void *pvParameters){
  UNUSED(pvParameters);
  pinMode(sensorPin, INPUT);
  attachInterrupt(digitalPinToInterrupt(sensorPin), pirActivated, RISING);
  Serial.println("waiting");

  while(1){
    // if (xSemaphoreTake(xLock, portMAX_DELAY) == pdTRUE){
      if(isAlarmed){
        ulTaskNotifyTake(pdTRUE, portMAX_DELAY);

        Serial.println("Got in here");

        sensor.startContinuous(100);
        if (sensor.read() <= 2000){
        Serial.println("Intruder!");
        Serial1.print(1);
        }
        sensor.stopContinuous();
      }
    //   // xSemaphoreGive(xLock);
    // }
  }
  vTaskDelay(500 / portTICK_PERIOD_MS);
}

void vBlinkTask(void *pvParameters){
  UNUSED(pvParameters);
  pinMode(indicator, OUTPUT);
  Serial.println("Blink Task Started"); // Debug statement

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

void pirActivated() {
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;
    vTaskNotifyGiveFromISR(pirTaskHandle, &xHigherPriorityTaskWoken);
    portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
}

void vReceiveTask(void *pvParameters){
  UNUSED(pvParameters);
  while(1){
    // Check if there is data available before attempting to take the semaphore
    if (Serial1.available()) {
      // if (xSemaphoreTake(xLock, portMAX_DELAY) == pdTRUE) {
        // Read and process the data
        Serial.println("available");
        char receivec = Serial1.read();
        Serial.println(receivec);
        if (receivec == '4'){
          isAlarmed = true;
        }
        else if(receivec == '5'){
          isAlarmed = false;
        }
        // xSemaphoreGive(xLock);
      // }
    }
    vTaskDelay(100 / portTICK_PERIOD_MS); // Delay to prevent hogging CPU
  }
}

void setup() {
  

  // Begin serial communication
  Serial.begin(9600);
  Serial1.begin(115200);
  
  Serial.println("start setup");
  // Initialize I2C communication and VL53L1X sensor
  Wire.begin();
  Wire.setClock(400000); // use 400 kHz I2C

  sensor.setTimeout(500);
  if (!sensor.init()) {
      Serial.println("Failed to detect and initialize sensor!");
      while (1); 
  }

  // Set sensor parameters for long distance mode and measurement timing
  sensor.setDistanceMode(VL53L1X::Long);
  sensor.setMeasurementTimingBudget(50000);  // Set timing budget to 50 ms

  Serial.println("Creating tasks");

  // Create tasks for sensor handling and blinking
  xTaskCreate(vPirTask, "PIR Task", configMINIMAL_STACK_SIZE + 1500, NULL, 1, &pirTaskHandle);
  xTaskCreate(vBlinkTask, "Blink Task", configMINIMAL_STACK_SIZE + 1500, NULL, 2, &blinkTaskHandle);
  xTaskCreate(vReceiveTask, "Receive Task", configMINIMAL_STACK_SIZE + 1500, NULL, 3, &receiveTaskHandle);

  // xLock = xSemaphoreCreateMutex();

  Serial.println("Created tasks");

  // Start the FreeRTOS scheduler
  vTaskStartScheduler();

  Serial.println("Setup Complete");
}

void loop() {
  // put your main code here, to run repeatedly:

}
