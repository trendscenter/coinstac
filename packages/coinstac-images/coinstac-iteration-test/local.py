#!/usr/bin/python

import sys
import json

def run(doc):
  if 'start' in doc['input']:
    sums = 1
  else:
    sums = doc['input']['sum'] + 1

  output = { "output": { "sum": sums } }
  return output
