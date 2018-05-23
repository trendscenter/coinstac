#!/usr/bin/python

import sys
import json

doc = json.loads(sys.argv[1])
raise Exception('local only throws error')
