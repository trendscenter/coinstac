# COINSTAC

<img src="https://raw.githubusercontent.com/MRN-Code/coinstac/master/img/coinstac.png" height="75px">

[![CircleCI](https://circleci.com/gh/trendscenter/coinstac.svg?style=shield)](https://circleci.com/gh/trendcenter/coinstac)
[![DOI](https://zenodo.org/badge/52497909.svg)](https://zenodo.org/badge/latestdoi/52497909)
[![DOI](https://joss.theoj.org/papers/10.21105/joss.02166/status.svg)](https://doi.org/10.21105/joss.02166)

_Collaborative Informatics and Neuroimaging Suite Toolkit for Anonymous Computation._ A research project by your friends at the [Center for Translational Research in Neuroimaging and Data Science (TReNDS)](https://www.trendscenter.org).

📖 Read the project’s paper, [_COINSTAC: A Privacy Enabled Model and Prototype for Leveraging and Processing Decentralized Brain Imaging Data_ on Frontiers in Neuroscience](http://journal.frontiersin.org/article/10.3389/fnins.2016.00365/full)

Find a full list of papers [here](./algorithm-development/papers.md).

For instructions on how to install and run COINSTAC as an end user, see the documents [here](https://github.com/trendscenter/coinstac-instructions).

COINSTAC is software to foster collaborative research, removing large barriers to traditional data-centric collaboration approaches.  It enables groups of users to run common analyses _on their own machines_ over _their own datasets_ with ease.  The results of these analyses are synchronized to the cloud, and undergo aggregate analyses processes using all contributor data.  Decentralized pipelines allow for distributed, iterative, and feature rich analyses to be run, opening new and exciting capabilities for collaborative computation. It also offers data anonymity through differential privacy algorithms, so members do not need to fear PHI traceback.

Let's do research!

**Table of Contents:**

* [The Problem](#the-problem)
* [The Solution](#the-solution)
* [Getting Started](#getting-started)
* [Releases](#releases)
* [Under The Hood](#under-the-hood)
* [License](#license)

## The Problem
You want to do research, and you want to include data from around the world. Unfortunately, orchestrating such an event is anything but trivial.

- Coordinating data-driven research can be difficult. Who's going to collect all of the files? Who is going to actually "run" all of the data?

- Ensuring privacy can be difficult. Can I trust other people or institutions with my research participants' data? Am I even allowed to share it?

- Large datasets can be expensive to transfer. When file sets are in the GB and TB range, network transfers are not immediately trivial or even practical.

- Valuable research data may often not be shared due to privacy or IRB constraints.

- "Smart bullies" have demonstrated ability to extract personal information from various aggregated, anonymized datasets. How can we share data without revealing confidential information?

Bottom line--collaborative group research requires a great deal of coordination. Human and business factors can hamper research from happening at a pace that we are able to handle! Constraints may even forbid group research to occur at all.

## The Solution
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

## Getting Started
- If you want to run COINSTAC as a user
  - Download the latest release for your operating system [here](https://github.com/trendscenter/coinstac/releases).
  - You can download sample Freesurfer data [here](https://github.com/trendscenter/coinstac/releases/download/v3.1.10/20170425-coinstac-test-data.zip), which can be used in a regression.
  - You can also download sample VBM data [here](https://github.com/trendscenter/coinstac/files/2134308/coinstac_ssr_vbm_test_data.zip), which can be used in a regression.
- If you are looking to join a consortium and contribute data to a decentralized pipeline, head over to [releases](https://github.com/trendscenter/coinstac/releases) to download the latest release.

- If you are a developer or scientist and want to design a decentralized computation, please see:
  - [The algorithm development guide](./algorithm-development/coinstac-development-guide.md) for how to build and test your own `Decentralized Computation`.

- If you would like to run your own COINSTAC remote server or contribute to development, please see the [setup instructions](./SETUP.md).
- We would love it you would like to contribute to development, our guidelines can be found [here](./CONTRIBUTING.md).

## Releases
Binary releases for several platforms can be found here, under each version's assets tab:
https://github.com/trendscenter/coinstac/releases

## Under The Hood
Developer documentation and system design information may be found over in our [technical docs](./TECHNICAL.md).

## Grants
COINSTAC is supported by the following grants:
- NSF 1631838/1631819, 1453432, 1539067
- NIH 1R01DA040487

## License
MIT. See [LICENSE](./LICENSE) for details.
