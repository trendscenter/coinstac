docker run -it -v $(pwd)/build:/usr/local/src/coinstac/packages/coinstac-ui/build/apps --rm coinstacteam/coinstac /bin/bash -c "cd packages/coinstac-ui && npm run build-${1}"
