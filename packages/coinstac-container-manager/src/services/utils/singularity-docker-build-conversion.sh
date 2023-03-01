#!/usr/bin/env bash
IMAGE_PATH=$1
DOCKER_IMAGE_NAME=$2

singularity build -F --fix-perms --sandbox $IMAGE_PATH docker://$DOCKER_IMAGE_NAME
code=$?
if [ $code != 0 ]; then
  >&2 echo "After build 1"
  >&2 echo "IMAGE_PATH = ${IMAGE_PATH}"
  >&2 echo "DOCKER_IMAGE_NAME = ${DOCKER_IMAGE_NAME}"
  exit $code
fi

cp --preserve=links "$IMAGE_PATH/.singularity.d/runscript" "$IMAGE_PATH/.singularity.d/startscript"
code=$?
if [ $code != 0 ]; then
  >&2 echo "After cp"
  >&2 echo "IMAGE_PATH = ${IMAGE_PATH}"
  >&2 echo "DOCKER_IMAGE_NAME = ${DOCKER_IMAGE_NAME}"
  exit $code
fi

singularity build -F --fix-perms $IMAGE_PATH.sif $IMAGE_PATH

#rm -rf $IMAGE_PATH

code=$?
if [ $code != 0 ]; then
  >&2 echo "After build 2"
  >&2 echo "IMAGE_PATH = ${IMAGE_PATH}"
  >&2 echo "DOCKER_IMAGE_NAME = ${DOCKER_IMAGE_NAME}"
  exit $code
fi
