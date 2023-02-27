---
sidebar_position: 2
---
# Mount and map
Computations are designed to consume data mounted into the `input` directory of the computation container. The expected directory structure for the computation must be specified so that the data owner can prepare and verify that their data is able to be consumed by the computation.

Where possible, computations should be designed to consume common data structures such as BIDS and the COINSTAC CSV. If your computation needs data to be in a structure that current standards do not cover, consider whether current standards can be improved or new standards can be created to accommodate your use case.

## Directory Mount

Computation authors can give COINSTAC users the ability to specify which directory they would like to mount to the computation container.

## COINSTAC CSV

The COINSTAC CSV contains a list of rows with each row representing a subject. Each subject row contains a cell with a relative file path to that subject’s image. It also contains cells with values for each of the covariates tracked. The images in these file paths are mounted in a flat structure into the container’s `input` directory, meaning the local machine's directory structure is not preserved. When consuming the COINSTAC CSV, the COINSTAC application gives the option to normalize column names in the `maps` user interface

Currently, the COINSTAC application does not support any type of directory transformation before mounting aside from the COINSTAC CSV.
