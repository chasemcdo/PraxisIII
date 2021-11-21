from __future__ import division, print_function
from http.server import HTTPServer , BaseHTTPRequestHandler, SimpleHTTPRequestHandler
import requests
import urllib.parse
from requests.exceptions import HTTPError
import psycopg2
import math
import json

Handler = SimpleHTTPRequestHandler

#conn = psycopg2.connect("host=3.128.190.132 port=5433 dbname=yugabyte user=yugabyte password=yugabyte")

class requestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path     
        pathParts = path.split("/")

        print(path, pathParts)

        if len(path) > 1:
            if path[2] == "a":

                print("WORKS:", path)
                                 

                jsonResponse = {}
                jsonResponse.setdefault("position")
                ##jsonResponse.setdefault("
                self.send_response(200)
                self.send_header('content-type', 'text/html')
                self.end_headers()

                output = 'hello'
                self.wfile.write(json.dumps(jsonResponse).encode())


def main():
    PORT = 8000
    server = HTTPServer(('', PORT), requestHandler)
    print("Server running on port %s" % PORT)
    server.serve_forever()

#################################################################################

if __name__ == '__main__':
    main()











