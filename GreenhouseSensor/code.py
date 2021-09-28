# Write your code here :-)
import board
import adafruit_dht
import time
import digitalio
dhtDevice = adafruit_dht.DHT22(board.GP1)

led = digitalio.DigitalInOut(board.GP16)
led.direction = digitalio.Direction.OUTPUT

while True:
    try:
         # Print the values to the serial port
         temperature_c = dhtDevice.temperature
         temperature_f = temperature_c * (9 / 5) + 32
         humidity = dhtDevice.humidity
         print("Temp: {:.1f} F / {:.1f} C    Humidity: {}% "
               .format(temperature_f, temperature_c, humidity))
    except RuntimeError as error:     # Errors happen fairly often, DHT's are hard to read, just keep going
         print(error.args[0])

    if humidity > 30:
        led.value = 1
        print('It is humid in here')
    else:
        led.value = 0
    time.sleep(2.0)





