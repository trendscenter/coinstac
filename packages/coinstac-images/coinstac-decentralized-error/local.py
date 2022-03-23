#!/usr/bin/python

import sys
import json
import os

doc = json.loads(sys.stdin.read())
if doc['input']['mode'] == 'local' and (doc['input']['user'] == doc['state']['clientId']):
    raise Exception('local throws error with runid: ' + os.path.basename(os.path.normpath(doc['state']['baseDirectory'])))

output = { "output": { "mode": doc['input']['mode'] } }
sys.stdout.write(json.dumps(output))
