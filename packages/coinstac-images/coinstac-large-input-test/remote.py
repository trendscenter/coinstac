#!/usr/bin/python

import sys
import json

doc = json.loads(sys.stdin.read())
for site, output in doc['input'].items():
    outFile = output['outFile']
    break
if doc['state']['iteration'] == 100:
    success = True
else:
    success = False

output = { "output": { "outputFile": outFile }, "success": success }
sys.stdout.write(json.dumps(output))
