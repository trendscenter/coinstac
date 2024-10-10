#!/usr/bin/env bash
IMAGE_PATH=$1
IMAGE_NAME=$(basename $IMAGE_PATH)
DOCKER_IMAGE_NAME=$2
WORK_PATH="/tmp/coinstacImages"
#${IMAGE_PATH#/}"

mkdir -p $WORK_PATH
code=$?
if [ $code != 0 ]; then
  >&2 echo "After making dir "
  >&2 echo "WORK_PATH = ${WORK_PATH}"
  >&2 echo "DOCKER_IMAGE_NAME = ${DOCKER_IMAGE_NAME}"
  exit $code
fi

singularity build -F --fix-perms --sandbox "$WORK_PATH/$IMAGE_NAME" docker://$DOCKER_IMAGE_NAME
code=$?
if [ $code != 0 ]; then
  >&2 echo "After build 1"
  >&2 echo "WORK_PATH = ${WORK_PATH}"
  >&2 echo "WORK_PATH w image = $WORK_PATH/$IMAGE_NAME"
  >&2 echo "DOCKER_IMAGE_NAME = ${DOCKER_IMAGE_NAME}"
  exit $code
fi

cp --preserve=links "$WORK_PATH/$IMAGE_NAME/.singularity.d/runscript" "$WORK_PATH/$IMAGE_NAME/.singularity.d/startscript"
code=$?
if [ $code != 0 ]; then
  >&2 echo "After cp"
  >&2 echo "WORK_PATH = ${$WORK_PATH}"
  >&2 echo "WORK_PATH w image = $WORK_PATH/$IMAGE_NAME"
  >&2 echo "DOCKER_IMAGE_NAME = ${DOCKER_IMAGE_NAME}"
  exit $code
fi

singularity build -F --fix-perms "$WORK_PATH/$IMAGE_NAME.sif" "$WORK_PATH/$IMAGE_NAME"

mv $WORK_PATH/$IMAGE_NAME.sif $IMAGE_PATH.sif

rm -rf $WORK_PATH

code=$?
if [ $code != 0 ]; then
  >&2 echo "After build 2"
  >&2 echo "IMAGE_PATH = ${IMAGE_PATH}"
  >&2 echo "DOCKER_IMAGE_NAME = ${DOCKER_IMAGE_NAME}"
  exit $code
fi
