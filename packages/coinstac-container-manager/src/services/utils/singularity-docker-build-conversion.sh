#!/usr/bin/env bash
IMAGE_PATH=$1
DOCKER_IMAGE_NAME=$2
WORK_PATH="/tmp/$IMAGE_PATH"


singularity build -F --fix-perms --sandbox $WORK_PATH docker://$DOCKER_IMAGE_NAME
code=$?
if [ $code != 0 ]; then
  >&2 echo "After build 1"
  >&2 echo "WORK_PATH = ${WORK_PATH}"
  >&2 echo "DOCKER_IMAGE_NAME = ${DOCKER_IMAGE_NAME}"
  exit $code
fi

cp --preserve=links "$WORK_PATH/.singularity.d/runscript" "$WORK_PATH/.singularity.d/startscript"
code=$?
if [ $code != 0 ]; then
  >&2 echo "After cp"
  >&2 echo "WORK_PATH = ${$WORK_PATH}"
  >&2 echo "DOCKER_IMAGE_NAME = ${DOCKER_IMAGE_NAME}"
  exit $code
fi

singularity build -F --fix-perms $WORK_PATH.sif $WORK_PATH

mv $WORK_PATH.sif $IMAGE_PATH.sif

code=$?
if [ $code != 0 ]; then
  >&2 echo "After build 2"
  >&2 echo "IMAGE_PATH = ${IMAGE_PATH}"
  >&2 echo "DOCKER_IMAGE_NAME = ${DOCKER_IMAGE_NAME}"
  exit $code
fi
