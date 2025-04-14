#!/usr/bin/env bash

REPOSITORY=$1

JSONTOKEN=$(curl -s "https://auth.docker.io/token?service=registry.docker.io&scope=repository:$REPOSITORY:pull")

PARSEDTOKEN=$(echo $JSONTOKEN | python3 -c 'import json,sys;print(json.load(sys.stdin)["token"])')

code=$?
if [ $code != 0 ]; then
  >&2 echo $PARSEDTOKEN
  >&2 echo $JSONTOKEN
  exit $code
fi

DIGEST=$(wget -q -O - --header="Authorization: Bearer ${PARSEDTOKEN}" --header="Accept: application/vnd.docker.distribution.manifest.v2+json" "https://index.docker.io/v2/$REPOSITORY/manifests/latest")

PARSEDDIGEST=$(echo $DIGEST | python3 -c 'import json,sys;print(json.load(sys.stdin)["config"]["digest"])')

code=$?
if [ $code != 0 ]; then
  >&2 echo $REPOSITORY
  >&2 echo $DIGEST
  >&2 echo $PARSEDTOKEN
  >&2 echo $PARSEDDIGEST
  exit $code
fi

echo -n $PARSEDDIGEST
