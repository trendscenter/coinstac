import json;
import argparse
from os import listdir
from os.path import isfile, join
import sys

parser = argparse.ArgumentParser(description='help read in my data from my local machine!')
parser.add_argument('--run', type=str,  help='grab coinstac args')
args = parser.parse_args()
args.run = json.loads(args.run)

username = args.run['username']

# inspect what args were passed
# runInputs = json.dumps(args.run, sort_keys=True, indent=4, separators=(',', ': '))
# sys.stderr.write(runInputs + "\n")

if 'remoteResult' in args.run and \
    'data' in args.run['remoteResult'] and \
    username in args.run['remoteResult']['data']:
    sys.exit(0); # no-op!  we already contributed our data

passedDir = args.run['userData']['dirs'][0]
sys.stderr.write("reading files from dir: " + passedDir)

files = [f for f in listdir(passedDir) if isfile(join(passedDir, f))]
allFileResults = {}
for f in files:
    allFileResults[f] = int(open(join(passedDir, f)).read())

computationOutput = json.dumps(allFileResults, sort_keys=True, indent=4, separators=(',', ': '))

# preview output data
# sys.stderr.write(computationOutput + "\n")

# send results
sys.stdout.write(computationOutput)
