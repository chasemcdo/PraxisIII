import digitalio
import board
import time
# import busio

# Setup Stop Button
write_pin = digitalio.DigitalInOut(board.GP0)
write_pin.direction = digitalio.Direction.INPUT
write_pin.pull = digitalio.Pull.UP

# Sets up LED for activity indicator
led = digitalio.DigitalInOut(board.LED)
led.direction = digitalio.Direction.OUTPUT

# Reads current contents of data.txt for future use
data_filename = 'data.txt'
f = open(data_filename, 'r')
string = f.read()
f.close()

# initiates gps_module
# gps_module = busio.UART(tx=board.GP4, rx=board.GP5)

# Turns on LED
led.value = 1
time_since = 0 # Used for checking time between writes (likely a more graceful way of implementation)

# Give time to take finger off button
time.sleep(5)

temp = 0 # Temporary counter for testing can be deleted later
f = open(data_filename, 'w')
f.write(string)
while True:
    time_since += 1
    if (time_since / 3 == 1):
        time_since = 0
        temp_str = f'\nNew Cordinates: {temp}' # Adjust Later
        f.write(temp_str)
        temp += 1 # Delete Later
        print(temp_str)   
    time.sleep(1)
    if (not write_pin.value):
        f.close()
        led.value = 0
        break

print('Exited Loop')
time.sleep(2)