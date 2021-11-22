import digitalio
import board
import time
import busio

data_filename = 'data.txt'
f = open(data_filename, 'r')
string = f.read()
f.close()

gps_module = busio.UART(tx=board.GP4, rx=board.GP5)

