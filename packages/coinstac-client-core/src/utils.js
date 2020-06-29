const http2 = require('http2');

const {
  HTTP2_HEADER_SCHEME,
  HTTP2_HEADER_METHOD,
  HTTP2_HEADER_PATH,
  HTTP2_METHOD_PUT,
  HTTP2_METHOD_POST,
} = http2.constants;

const request = (method, url, path, body) => new Promise((resolve) => {
  const client = http2.connect(url);

  let buffer = '';

  const payload = {
    [HTTP2_HEADER_SCHEME]: 'http',
    [HTTP2_HEADER_METHOD]: method,
    [HTTP2_HEADER_PATH]: path,
    'Content-Type': 'application/json',
  };

  if ([HTTP2_METHOD_POST, HTTP2_METHOD_PUT].includes(method)) {
    payload['Content-Length'] = Buffer.from(JSON.stringify(body)).length;
    buffer = Buffer.from(JSON.stringify(body));
  }

  const req = client.request(payload);

  req.setEncoding('utf8');

  const data = [];

  req.on('data', (chunk) => {
    data.push(chunk);
  });

  if ([HTTP2_METHOD_POST, HTTP2_METHOD_PUT].includes(method)) {
    req.write(buffer);
  }

  req.end();
  req.on('end', () => {
    resolve(data.join());
  });
});

module.exports = {
  request,
};
