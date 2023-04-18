#!/usr/bin/python

import sys
import json

def run(doc):
  sums = 0
  for site, output in doc['input'].items():
      sums = sums + output['sum'];
  sums = sums / len(doc['input'])
  if sums > 10000:
      success = True
  else:
      success = False

  output = { "output": { "sum": sums }, "success": success }
  return output
