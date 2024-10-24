# AlarmTrap
## Alarm With Camera Trap
This alarm trap is a portable and efficient camera trap with an integrated web-interface, to help you understand what is going on in your home! It makes use of 2 MCU's and multiple components to provide reliable and efficient sensing, with quick communication. The web interface can be accessed through firefox or chrome. If you want to try this out for yourself, the code was made for a STM32F446RE and {insert ESP32 Model name here}, making use of the [DFRobot PIR Sensor](https://wiki.dfrobot.com/PIR_Motion_Sensor_V1.0_SKU_SEN0171) and [VL53L1X](https://www.st.com/en/imaging-and-photonics-solutions/vl53l1x.html). 

## Using the Camera Trap
To use the camera trap at home it is important to understand the libraries and code used.
Without modifying the code, the binaries are ready to upload to the STM and ESP and available through the binaries directory. To connect the boards and components please see the pinout diagram below.

### PINOUT DIAGRAM
![image](https://github.com/user-attachments/assets/4964d674-5fae-407a-836c-4ff30c359657)




## Accessing the Web Interface
Once connected to the board the web interface can be run through npm start, and should be available on your local network.

## Modifying Code
If you would like to modify the code in order to ensure it's compatibility with a different model number or to make changes, the code for the two boards was developed using the arduinoIDE, so please see the readme's in their relevant directories to understand the code and libraries used. 
