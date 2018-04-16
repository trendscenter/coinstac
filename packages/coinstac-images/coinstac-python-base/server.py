import tornado.ioloop
import tornado.web
import tornado.process
import tornado.options
from tornado.gen import Return, coroutine
from tornado.concurrent import Future
import json, cgi

tornado.options.parse_command_line()

class MainHandler(tornado.web.RequestHandler):
    @coroutine
    def post(self):
        params = tornado.escape.json_decode(self.request.body)
        cmd = params["command"]
        code, output, error = yield self.callCommand(cmd)
        if code == 0:
            self.write(output)
        else:
            raise tornado.web.HTTPError(status_code=499, reason=error)

    @coroutine
    def callCommand(self, cmd):
        subProc = tornado.process.Subprocess(
          [cmd[0], cmd[1]],
          stdin=tornado.process.Subprocess.STREAM,
          stdout=tornado.process.Subprocess.STREAM,
          stderr=tornado.process.Subprocess.STREAM
        )

        yield subProc.stdin.write(bytes(cmd[2], 'UTF-8'))
        subProc.stdin.close()

        code, result, error = yield [
          subProc.wait_for_exit(raise_error=False),
          subProc.stdout.read_until_close(),
          subProc.stderr.read_until_close()
        ]
        message = cgi.escape(str(error, 'UTF-8'), quote=True).\
           replace(u'\n', u'<br />').\
           replace(u'\t', u'&emsp;').\
           replace(u'  ', u' &nbsp;')
        raise Return((code, result, message))


def make_app():
    return tornado.web.Application([
        (r"/run", MainHandler),
    ])

if __name__ == "__main__":
    app = make_app()
    app.listen(8881)
    print('computation server starting')
    tornado.ioloop.IOLoop.current().start()
