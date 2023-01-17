set -e

REPOSITORY=$1

TOKEN=$(curl -s "https://auth.docker.io/token?service=registry.docker.io&scope=repository:$REPOSITORY:pull" | python3 -c 'import json,sys;print(json.load(sys.stdin)["token"])')

curl -s -H "Authorization: Bearer ${TOKEN}" -H "Accept: application/vnd.docker.distribution.manifest.v2+json" https://index.docker.io/v2/$REPOSITORY/manifests/latest | python3 -c 'import json,sys;print(json.load(sys.stdin)["config"]["digest"])'
~
