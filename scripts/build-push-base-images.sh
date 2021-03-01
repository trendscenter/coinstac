for df in packages/coinstac-images/coinstac-base/dockerfiles/*
do
  BASEFILE=$(basename $df)
  docker build -f $df -t \
  coinstacteam/coinstac-base:${BASEFILE/Dockerfile-/} \
  packages/coinstac-images/coinstac-base/ || exit $?
  docker push coinstacteam/coinstac-base:${BASEFILE/Dockerfile-/} || exit $?
done
docker tag coinstacteam/coinstac-base:python3.7-buster-slim coinstacteam/coinstac-base:latest
docker push coinstacteam/coinstac-base:latest
