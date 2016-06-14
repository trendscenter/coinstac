import sys
import json

try:
  z = 0
  bad_intent.nomethod()

except:
  sys.stderr.write('caught per expectation')

else:
  sys.stderr.write('should have raised an exception!')

finally:
  output = json.dumps({ 'test': 'result' }, sort_keys=True, indent=4, separators=(',', ': '))
  sys.stdout.write(output)
