#!/usr/bin/python

import sys
import json

doc = json.loads(sys.stdin.read())
if doc['state']['iteration'] == 1:
    doc['input']['outputFile'] = 'a' * 100000000
output = { "output": { "outFile": doc['input']['outputFile'] } }
sys.stdout.write(json.dumps(output))
