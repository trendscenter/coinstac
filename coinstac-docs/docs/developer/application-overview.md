---
sidebar_position: 2
---

# Application overview
# Main components and their packages

## GUI
The GUI is how researchers (our primary users) interact with the COINSTAC system to perform research.
* [coinstac-ui](https://github.com/trendscenter/coinstac/tree/master/packages/coinstac-ui)

## COINSTAC-simulator
COINSTAC-simulator is primarly used by computation authors to develop and test their computations
* [coinstac-simulator](https://github.com/trendscenter/coinstac/tree/master/packages/coinstac-simulator)

## COINSTAC-Vaults
COINSTAC-Vaults allow datasets to be hosted in a way that they are persistently available for analysis using COINSTAC, without the need for manual participation in consortia.
* [coinstac-headless-client](https://github.com/trendscenter/coinstac/tree/master/packages/coinstac-headless-client)

## API Server
The API server is the central COINSTAC service. It keeps track of users, pipelines, consortia, and runs.
The API Server hosts the GraphQL endpoints called by the UI and other services.
* [coinstac-api-server](https://github.com/trendscenter/coinstac/tree/master/packages/coinstac-api-server)


