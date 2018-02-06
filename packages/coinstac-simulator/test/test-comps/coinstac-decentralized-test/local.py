#!/usr/bin/python

import sys
import json

doc = json.loads(sys.argv[1])
if 'start' in doc['input']:
    sums = 1
else:
    sums = doc['input']['sum'] + 1

output = { "output": { "sum": sums } }
sys.stdout.write(json.dumps(output))
