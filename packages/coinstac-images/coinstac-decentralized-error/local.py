#!/usr/bin/python

import sys
import json

doc = json.loads(sys.stdin.read())
if doc['input']['mode'] == 'local' and (doc['input']['user'] == doc['state']['clientId']):
    raise Exception('local throws error')

output = { "output": { "mode": doc['input']['mode'] } }
sys.stdout.write(json.dumps(output))
