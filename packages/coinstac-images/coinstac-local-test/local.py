#!/usr/bin/python

import sys
import json

doc = json.loads(sys.stdin.read())
if 'start' in doc['input']:
    sums = doc['input']['start']
    finish = sums + 1
    doc['cache']['finish'] = finish
else:
    sums = doc['input']['sum'] + 1
    finish = doc['cache']['finish']

if sums > doc['cache']['finish']:
    success = True
else:
    success = False

output = { "output": { "sum": sums }, "cache": { "finish": finish }, "success": success }
sys.stdout.write(json.dumps(output))
