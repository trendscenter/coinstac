import json, cgi, sys, traceback

sys.path.append("./local")

import tornado.ioloop
import tornado.web
import tornado.process
import tornado.options
from tornado.gen import Return, coroutine
from tornado.concurrent import Future

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
        print(cmd)
        yield subProc.stdin.write(bytes(cmd[2], 'UTF-8'))
        subProc.stdin.close()

        code, result, error = yield [
          subProc.wait_for_exit(raise_error=False),
          subProc.stdout.read_until_close(),
          subProc.stderr.read_until_close()
        ]
        raise Return((code, result, error))

    def write_error(self, status_code, **kwargs):
        # self.set_header('Content-Type', 'text/plain')
        self.set_header('Content-Type', 'text/plain')
        if self.settings.get("serve_traceback") and "exc_info" in kwargs:
            # in debug mode, try to send a traceback
            print("Server internal stack:")
            for line in traceback.format_exception(*kwargs["exc_info"]):
                print(line)

        compError = "Computation failed " + str(status_code) + ": " + self._reason
        print("Computation error message:")
        print(compError)
        self.write(compError)
        # oh hey a magic line of code, what does it do?
        # the server tries to write _reason to the headers, causing issues
        # since it contains newlines etc... :(
        self._reason = '';


def make_app():
    return tornado.web.Application([
            (r"/run", MainHandler),
        ],
        **{ "serve_traceback": True }
    )

if __name__ == "__main__":
    app = make_app()
    # set buffer to 230 MB
    server = tornado.httpserver.HTTPServer(app, max_buffer_size=230000000)
    server.listen(8881)
    print('computation server starting')
    tornado.ioloop.IOLoop.current().start()
