#!/usr/bin/env bash
SANDBOX_IMAGE_DIRECTORY=$1
DOCKER_IMAGE_NAME=$2
SINGULARITY_IMAGE_NAME_WITH_HASH=$3

singularity build -F --sandbox $SANDBOX_IMAGE_DIRECTORY docker://$DOCKER_IMAGE_NAME
code=$?
if [ $code != 0 ]; then
  >&2 echo "After build 1"
  >&2 echo "SANDBOX_IMAGE_DIRECTORY = ${SANDBOX_IMAGE_DIRECTORY}"
  >&2 echo "DOCKER_IMAGE_NAME = ${DOCKER_IMAGE_NAME}"
  >&2 echo "SINGULARITY_IMAGE_NAME_WITH_HASH = ${SINGULARITY_IMAGE_NAME_WITH_HASH}"
  exit $code
fi

cp --preserve=links "$SANDBOX_IMAGE_DIRECTORY/.singularity.d/runscript" "$SANDBOX_IMAGE_DIRECTORY/.singularity.d/startscript"
code=$?
if [ $code != 0 ]; then
  >&2 echo "After cp"
  >&2 echo "SANDBOX_IMAGE_DIRECTORY = ${SANDBOX_IMAGE_DIRECTORY}"
  >&2 echo "DOCKER_IMAGE_NAME = ${DOCKER_IMAGE_NAME}"
  >&2 echo "SINGULARITY_IMAGE_NAME_WITH_HASH = ${SINGULARITY_IMAGE_NAME_WITH_HASH}"
  exit $code
fi

singularity build -F $SINGULARITY_IMAGE_NAME_WITH_HASH.sif $SANDBOX_IMAGE_DIRECTORY

code=$?
if [ $code != 0 ]; then
  >&2 echo "After build 2"
  >&2 echo "SANDBOX_IMAGE_DIRECTORY = ${SANDBOX_IMAGE_DIRECTORY}"
  >&2 echo "DOCKER_IMAGE_NAME = ${DOCKER_IMAGE_NAME}"
  >&2 echo "SINGULARITY_IMAGE_NAME_WITH_HASH = ${SINGULARITY_IMAGE_NAME_WITH_HASH}"
  exit $code
fi
