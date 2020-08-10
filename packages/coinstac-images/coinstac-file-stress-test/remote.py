#!/usr/bin/python

import sys
import json
import hashlib
import os
import shutil
import subprocess

doc = json.loads(sys.stdin.read())
output = {}
success = False
for site, output in doc["input"].items():
    if doc["state"]["iteration"] == 1:
        files = os.listdir(os.path.join(doc["state"]["baseDirectory"], site))
        for f in files:
            shutil.copy(os.path.join(doc["state"]["baseDirectory"], site, f), doc["state"]["transferDirectory"])
    else:
        path, dirs, files = next(os.walk(os.path.join(doc["state"]["baseDirectory"], site)))
        output.update({ site: len(files) })
        success = True

sys.stdout.write(json.dumps({ "output": output, "success": success }))
