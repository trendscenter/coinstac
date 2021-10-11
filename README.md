# Collaborative Informatics and Neuroimaging Suite Toolkit for Anonymous Computation (COINSTAC)

<p float="left">
  <img src="https://raw.githubusercontent.com/MRN-Code/coinstac/master/img/coinstac.png" height="75px">
</p>

[![CircleCI](https://circleci.com/gh/trendscenter/coinstac.svg?style=shield)](https://circleci.com/gh/trendcenter/coinstac)
[![DOI](https://zenodo.org/badge/52497909.svg)](https://zenodo.org/badge/latestdoi/52497909)
[![DOI](https://joss.theoj.org/papers/10.21105/joss.02166/status.svg)](https://doi.org/10.21105/joss.02166)

A federated learning solution by your friends at the [Center for Translational Research in Neuroimaging and Data Science (TReNDS)](https://www.trendscenter.org).
<p float="right">
  <img src="https://user-images.githubusercontent.com/2123095/133630259-6973616c-2134-4a56-9ace-7d9618126713.png" height="75px">
</p>

## Table of Contents

* [Introduction](#introduction)
  * [Deep Dive](#deep-dive)
* [Quick Start Guide](#quick-start-guide)
* [Description](#description)
  * [The Problem](#the-problem)
  * [The Solution](#the-solution)
* [For Developers and Contributors](#for-developers-and-contributors)
* [Releases](#releases)
* [License](#license)

## Introduction

COINSTAC is software to foster collaborative research, removing large barriers to traditional data-centric collaboration approaches.  It enables groups of users to run common analyses _on their own machines_ over _their own datasets_ with ease.  The results of these analyses are synchronized to the cloud, and undergo aggregate analyses processes using all contributor data.  Federated (decentralized) pipelines allow for distributed, iterative, and feature rich analyses to be run, opening new and exciting capabilities for collaborative computation. It also offers data anonymity through differentially private algorithms, so members do not need to fear PHI traceback.

Let's do research!

### Deep Dive
📖 For a deep dive, you can read the project’s paper, [_COINSTAC: A Privacy Enabled Model and Prototype for Leveraging and Processing Decentralized Brain Imaging Data_](http://journal.frontiersin.org/article/10.3389/fnins.2016.00365/full) on Frontiers in Neuroscience.

We also curate a [list of conference and journal papers](./algorithm-development/papers.md) on methods and studies related to federated learning and COINSTAC.

## Quick Start Guide
- If you want to run COINSTAC as an end user
  - Download the [latest release](https://github.com/trendscenter/coinstac/releases) for your operating system.
  - You can [download sample data](https://github.com/trendscenter/coinstac/releases/download/v3.1.10/20170425-coinstac-test-data.zip) of volumes of regions of interest in the brain, in a format typically produced by [FreeSurfer](https://surfer.nmr.mgh.harvard.edu/), which can be used in a federated regression.
  - You can also [download sample neuroimages](https://github.com/trendscenter/coinstac/files/2134308/coinstac_ssr_vbm_test_data.zip) (structural MRI preprocessed with voxel-based morphometry (VBM)), which can be used in a federated regression.

- For more guidance, please see these [detailed instructions](https://github.com/trendscenter/coinstac-instructions) on how to install and run COINSTAC.

## Description
### The Problem
You want to do research, and you want to include data from around the world. Unfortunately, orchestrating such an event is anything but trivial.

- Coordinating data-driven research can be difficult. Who's going to collect all of the files? Who is going to actually "run" all of the data?

- Ensuring privacy can be difficult. Can I trust other people or institutions with my research participants' data? Am I even allowed to share it?

- Large datasets can be expensive to transfer. When file sets are in the GB and TB range, network transfers are not immediately trivial or even practical.

- Valuable research data may often not be shared due to privacy or IRB constraints.

- "Smart bullies" have demonstrated ability to extract personal information from various aggregated, anonymized datasets. How can we share data without revealing confidential information?

Bottom line--collaborative group research requires a great deal of coordination. Human and business factors can hamper research from happening at a pace that we are able to handle! Constraints may even forbid group research to occur at all.

### The Solution
Let's remove these barriers. The best usage of research data is to apply it _everywhere it can be useful_. Our strategy enables otherwise "locked-down data" to become useful again.

COINSTAC removes the barriers to collaborative analysis by:

- **decentralizing analyses and computation**
  - each user performs analyses/pipelines/etc all on their own computers. Bits and pieces of each users' output _may_ be sent to a central compute node
  - a central compute node performs a complimentary component of the group analysis, generally a Machine Learning algorithm. This node may trigger adjusted computations on users' machines, generally in effort to improve a model, which the research is trying to predict!
- _not_ synchronizing full datasets. instead, **synchronizing only resultant analysis metrics**
  - as previously discussed, central compute nodes aggregate these metrics, and attempt to draw conclusions from the contributor swarm
  - because machine learning algorithms can be designed to model outcomes via artifacts of your analysis Pipelines, we keep your data safely and conveniently on your own machine, _untouched_.
- **applying differential privacy** strategies to truly anonymize private data, whilst still permitting collaboration.

You may wonder why we haven't been doing this before! Us too. Let's get started!

## For Developers and Contributors

- If you are a developer or scientist and want to design a decentralized computation, please see:
  - The [algorithm development guide](./algorithm-development/coinstac-development-guide.md) for how to build and test your own `Decentralized Computation`.

- If you would like to run your own COINSTAC remote server or contribute to development, please see the [setup instructions](./SETUP.md).
  - ![#f03c15](https://via.placeholder.com/15/f03c15/000000?text=+) Reminder: if you just want to use COINSTAC, please see the [Quick Start Guide](#quick-start-guide).
- We would love for you to contribute to development. Please see our [contribution guidelines](./CONTRIBUTING.md).
- Developer documentation and system design information may be found over in our [technical docs](./TECHNICAL.md).

## Security

- If you have questions regarding security, please read our [security overview](./SECURITY.md).

## Releases
Binary releases for several platforms can be found [here](https://github.com/trendscenter/coinstac/releases), under each version's assets tab.

## Acknowledgements
COINSTAC is supported by the following grants:
- NSF 1631838/1631819, 1453432, 1539067
- NIH 1R01DA040487, R01MH121246, R01MH121246-02S1, R01DA049238, R01MH120482

## License
MIT. See [LICENSE](./LICENSE) for details.
