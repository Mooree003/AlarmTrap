# STM 32

## Model
For this camera trap we have used a STM32F446RE, so relevant pin maps and binaries are made specifically for this model. However, we have provided the source code in the .ino file so if you have a different board you can make some small changes and upload it to your own device.

## Pin Map
image here

The pin map shown above describes the pins we use to build our alarm system. The PIR Sensor is powered with the 5V power source, whereas we power the VL53L1X with 3V3 power source.

## Algorithm
The STM follows the following algorithm
![image](https://github.com/user-attachments/assets/4d72f88a-8f67-418e-aa36-f29783c59de3)
In order to increase or decrease the range of the VL53L1X in order to best suit your needs, edit the line ```cpp if (sensor.read() <= 2000)``` where 2000 represents 2000mm (2m) 

