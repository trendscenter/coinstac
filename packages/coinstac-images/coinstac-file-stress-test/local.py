#!/usr/bin/python

import sys
import json
import os
import hashlib
import shutil
import random

doc = json.loads(sys.stdin.read())
if doc["state"]["iteration"] == 1:
    size = int(doc["input"]["size"]) // 100
    for x in range(100):
        fileData = bytearray(random.getrandbits(8) for _ in range(size))
        binFile = open(os.path.join(doc["state"]["transferDirectory"], str(x) + ".txt"), "wb")
        binFile.write(fileData)
        binFile.close()
output = { "output": {} }
sys.stdout.write(json.dumps(output))
