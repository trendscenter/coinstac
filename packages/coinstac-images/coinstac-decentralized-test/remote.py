#!/usr/bin/python

import sys
import json

doc = json.loads(sys.stdin.read())
sums = 0
for site, output in doc['input'].items():
    sums = sums + output['sum'];
sums = sums / len(doc['input'])
if sums > 20:
    success = True
else:
    success = False

output = { "output": { "sum": sums }, "success": success }
sys.stdout.write(json.dumps(output))
