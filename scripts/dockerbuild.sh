docker run -it -v $(pwd)/build:/usr/local/src/coinstac/packages/coinstac-desktop-app/build/apps --rm coinstacteam/coinstac /bin/bash -c "cd packages/coinstac-desktop-app && npm run build-${1}"
