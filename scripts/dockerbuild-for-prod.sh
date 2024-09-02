set -e

docker build -f packages/coinstac-images/coinstac/dockerfiles/Dockerfile-prod -t coinstacteam/coinstac-prod .
docker build -f packages/coinstac-images/coinstac/dockerfiles/Dockerfile-api-prod -t coinstacteam/coinstac-api-prod .
docker build -f packages/coinstac-images/coinstac/dockerfiles/Dockerfile-server-prod -t coinstacteam/coinstac-server-prod .
