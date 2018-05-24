#!/usr/bin/python

import sys
import json

doc = json.loads(sys.stdin.read())

for site, inputs in doc['input'].items():
    if inputs['mode'] == 'remote':
        raise Exception('remote throws error')

output = { "output": { "foo": "foo" }, "success": success }
sys.stdout.write(json.dumps(output))
