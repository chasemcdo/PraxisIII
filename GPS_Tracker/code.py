import digitalio
import board
import time
import busio
import adafruit_gps

# Setup Stop Button
write_pin = digitalio.DigitalInOut(board.GP0)
write_pin.direction = digitalio.Direction.INPUT
write_pin.pull = digitalio.Pull.UP

# Setup Activation LED
led = digitalio.DigitalInOut(board.LED)
led.direction = digitalio.Direction.OUTPUT

# Read current data from file
data_filename = 'data.txt'
f = open(data_filename, 'r')
string = f.read()
f.close()

# Setup GPS module
gps_module = busio.UART(tx=board.GP4, rx=board.GP5, baudrate=9600)
gps = adafruit_gps.GPS(gps_module, debug=False)

# Turn on LED and wait 5 seconds to give user time to unpress button
led.value = 1
time.sleep(5)

# Initialize current time for spacing writes
last_print = time.monotonic()

# Open data.txt for writing, write old data and begin loop
f = open(data_filename, 'w')
f.write(string)
while True:
    current = time.monotonic()
    gps.update()

    if (current - last_print >= 5):
        last_print = current
        if (gps.timestamp_utc):
            temp_str = f"\n{gps.timestamp_utc[3] + gps.timestamp_utc[4]/60},{gps.latitude},{gps.longitude}"
            f.write(temp_str)
            print(temp_str)
        else:
            print('No GPS Info Yet')

    if (not write_pin.value):
        f.close()
        break

led.value = 0
time.sleep(2)