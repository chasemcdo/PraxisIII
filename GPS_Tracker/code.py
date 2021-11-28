import digitalio
import board
import time
import busio
import adafruit_gps

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
gps_module = busio.UART(tx=board.GP4, rx=board.GP5, baudrate=9600)
gps = adafruit_gps.GPS(gps_module, debug=False)

# Turn on LED
led.value = 1
# Wait so that user can unpress button
time.sleep(5)

last_print = time.monotonic() # Records current time

# Opens file for writing, rewrites old data, and starts loop to gather fresh data
f = open(data_filename, 'w')
f.write(string)
while True:
    current = time.monotonic()
    gps.update() # updates gps info
    
    if (current - last_print >= 3):
        last_print = current
        temp_str = f"\n{gps.timestamp_utc[3] + gps.timestamp_utc[4]/60},{gps.latitude},{gps.longitude}"
        f.write(temp_str)
        #print(temp_str)
        
    if (not write_pin.value):
        f.close()
        break

led.value = 0
time.sleep(2)