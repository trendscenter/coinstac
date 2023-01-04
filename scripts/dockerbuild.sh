docker run -it -v $(pwd)/build:/usr/local/src/coinstac/packages/coinstac-desktop-client/build/apps --rm coinstacteam/coinstac /bin/bash -c "cd packages/coinstac-desktop-client && npm run build-${1}"
