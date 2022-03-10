# Coinstac python utility library

## Utilities
- [Install](#install)
- [Usage](#usage)
  * [Python websocket interface](#python-websocket-interface)

## Install
The Coinstac python utility library is available on pypi
`pip install coinstac`

## Usage

`import coinstac`

### Python websocket interface
Normally Coinstac computations require a base image that contains a microservice 
entrypoint that allows communication with coinstac at large. This interaface allows 
you to forgo that and has a python library manage instead.

The advantages of this approach are 
* faster initial container start
* no overhead from the python interpreter restarting the script each iteration
* the freeing up ofstdout/err for other purposes

To use it simply require your local and remote code as functions and put them
into an entrypoint file defined in your compspec, and pass them to `coinstac.start`
```python
import scripts.localFn as localFn
import scripts.remoteFn as remoteFn

coinstac.start(localFn, remoteFn)
```
