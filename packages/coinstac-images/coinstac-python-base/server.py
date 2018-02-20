#!/usr/bin/python

from gevent import monkey
# monkey patching subprocess is borked for non-blocking file reads
# https://github.com/gevent/gevent/issues/222
monkey.patch_all(subprocess=False)
from bottle import route, run, app, request, response, abort, error
from subprocess import Popen, PIPE, STDOUT
import json, fcntl, select, os

app().catchall = False

@route('/run', method='POST')
def runCommand():
    cmd = request.json['command']
    p = Popen(cmd, stdin=False, stdout=PIPE, stderr=PIPE)
    fcntl.fcntl(p.stdout, fcntl.F_SETFL, os.O_NONBLOCK)
    select.select([p.stdout], [], [])
    fcntl.fcntl(p.stderr, fcntl.F_SETFL, os.O_NONBLOCK)
    select.select([p.stderr], [], [])
    output = p.stdout.read()
    error = p.stderr.read()
    if not error:
       # status is overwritten on a mult reqs if one fails :-(
       response.status = 200
       return output
    else:
       abort(499, error)

@error(499)
def kaput(error):
    return json.dumps({ 'error': error.body.decode("utf-8")  })

run(host='0.0.0.0', port=8881, server='gevent')
