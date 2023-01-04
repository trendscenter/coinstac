set -e

docker build -f packages/coinstac-images/coinstac/dockerfiles/Dockerfile-ci -t coinstacteam/coinstac:ci .
docker build -f packages/coinstac-images/coinstac/dockerfiles/Dockerfile-ci-ui -t coinstacteam/coinstac-desktop-client:ci .
docker build -f packages/coinstac-images/coinstac/dockerfiles/Dockerfile-api -t coinstacteam/coinstac-api .
docker build -f packages/coinstac-images/coinstac/dockerfiles/Dockerfile-server -t coinstacteam/coinstac-server .
