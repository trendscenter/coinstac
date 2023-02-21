---
sidebar_position: 2
---

# Mounting and Transforming Data for Computation in COINSTAC
When running computations on data that is stored on a local machine or outer COINSTAC node, it is important to mount the relevant files into the computation container in a format that the computation can process. This ensures that the data is properly configured for the specific pipeline it is a part of.

## COINSTAC CSV Format
In COINSTAC, the preferred format for input data is a CSV file that follows a specific format. The CSV file should contain several rows, with each row representing a subject. Each subject's row should include a file path to the relevant image file, as well as values for each of the tracked covariates.

COINSTAC will consume this CSV and mount each subject's file into the input directory of the container. Users can also use the mapping UI to normalize their column names to what is defined by the pipeline creator, and the files will be linked in the input directory with the normalized column names.

## Directory Mount
If you prefer to handle the data in your own way, there is an option to mount a directory into the container without COINSTAC doing any transformation beforehand.
