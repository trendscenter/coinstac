---
sidebar_position: 2
---

# Mapping - Mounting and Transforming Data for Computation in COINSTAC
To run computations on data that is stored on a local machine, the relevant files must be mounted into the computation container in a format that the computation can consume. This may mean the directory structure is different in the coinstac input directory than in the source directory on the local machine. Normalizing covariate names is another type of transformation that may need to happen at the mounting/mapping stage.

## COINSTAC CSV Format
In COINSTAC, the preferred format for input data is a CSV file that follows a specific format. The CSV file should contain several rows, with each row representing a subject. Each subject's row should include a file path to the relevant image file, as well as values for each of the tracked covariates.

COINSTAC will consume this CSV and mount each subject's file into the input directory of the container. Users can also use the mapping UI to normalize their column names to what is defined by the pipeline creator, and the files will be linked in the input directory with the normalized column names.

## Directory Mount
If a computation author prefers to handle the data in another way, there is the option to mount a directory into the container without COINSTAC doing any transformation beforehand.
