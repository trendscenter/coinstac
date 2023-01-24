set -e

singularity build -F --sandbox $2 docker://$1
cp $IMAGE_DIR/.singularity.d/runscript $2/.singularity.d/startscript
singularity build -F $2.sif $IMAGE_DIR
