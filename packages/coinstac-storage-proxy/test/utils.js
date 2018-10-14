'use strict';

const axios = require('axios');
const tape = require('tape');
const Consortium = require('coinstac-common').models.Consortium;
const url = require('url');
const utils = require('../src/utils');

const mockUrl = url.parse('http://localhost:5984');
const mockConsortium = new Consortium({
  _id: 'thisisonlyatest',
  users: ['adumbledor', 'hpotter'],
  owners: ['adumbledor'],
  description: 'foo',
  label: 'foo',
  tags: ['foo'],
});

/**
 * Intercept axios responses and return the provided object in `response.data`
 * @param  {*} responseObj object to respond with
 * @return {function}          function that will remove the interceptor.
 */
const mockAxiosResponse = () => {
  let requestUrl;
  const setRequestUrl = (request) => {
    requestUrl = request.url;
    return requestUrl;
  };

  const returnMockConsortium = () => {
    if (requestUrl.match(/consortia/)) {
      return { data: mockConsortium };
    }
    return { error: 'Unknown URL' };
  };

  const requestInterceptor = axios.interceptors.request.use(setRequestUrl);
  const responseInterceptor = axios.interceptors.response.use(
    returnMockConsortium,
    returnMockConsortium
  );

  const removeInterceptor = () => {
    axios.interceptors.request.eject(requestInterceptor);
    axios.interceptors.response.eject(responseInterceptor);
  };

  return removeInterceptor;
};

tape('Utils: getPort', (t) => {
  const mockRequest1 = { server: {}, info: { host: 'localhost:3000' } };
  const mockRequest2 = { server: { info: { port: 4000 } } };
  const mockRequest3 = { server: {} };

  t.plan(3);
  t.equal(utils.getPort(mockRequest1), 3000, 'get port from request host');
  t.equal(utils.getPort(mockRequest2), 4000, 'get port from server info');
  t.equal(utils.getPort(mockRequest3), 80, 'fallback to port 80');
});

tape('Utils: getUnauthorizedUrl', (t) => {
  const mockRequest = { info: { host: 'localhost:3000' } };
  const expectedUrl = 'http://localhost:3000/unauthorized?msg=this%20test';
  const msg = 'this test';

  t.plan(1);
  t.equal(utils.getUnauthorizedUrl(mockRequest, msg), expectedUrl);
});

tape('Utils: getTargetUrl', (t) => {
  const mockRequest1 = { path: '/coinstacdb/up/consortia/foo-bar' };
  const mockRequest2 = { path: '/coinstacdb/down/consortium-foo-bar/bin-baz' };
  const mockRequest3 = {
    path: '/coinstacdb/up/consortia/foo-bar',
    query: { foo: 'bar' },
  };
  const mockTargetBaseUrl = url.parse('http://localhost:5984');

  t.plan(3);
  t.equal(
    utils.getTargetUrl(mockTargetBaseUrl, mockRequest1),
    'http://localhost:5984/consortia/foo-bar',
    'get consortia target path'
  );
  t.equal(
    utils.getTargetUrl(mockTargetBaseUrl, mockRequest2),
    'http://localhost:5984/consortium-foo-bar/bin-baz',
    'get consortium-specific datastore target path'
  );
  t.equal(
    utils.getTargetUrl(mockTargetBaseUrl, mockRequest3),
    'http://localhost:5984/consortia/foo-bar?foo=bar',
    'include querystring'
  );
});

tape('Utils: getConsortium', (t) => {
  const removeInterceptor = mockAxiosResponse();
  t.plan(1);
  utils.getConsortium(mockUrl, { path: 'consortia/foo' })
    .then((consortium) => {
      t.deepEquals(consortium, mockConsortium, 'returns a consortium');
    })
    .catch((error) => {
      t.fail(error.message);
    })
    .then(removeInterceptor);
});

tape('Utils: getConsortiumIdFromRequest', (t) => {
  t.plan(2);
  const makeBadFnCall = () => utils.getConsortiumIdFromRequest({ path: '/foo/bar-baz' });

  t.equals(
    utils.getConsortiumIdFromRequest({ path: '/consortia/csrtm-id' }),
    'csrtm-id',
    'consortiumId from consortia request'
  );
  t.throws(
    makeBadFnCall,
    /Could not resolve consortiumId from request/,
    'throws error on invalid resource path'
  );
});

tape('Utils: getDocumentIdFromRequest', (t) => {
  t.plan(2);
  const makeBadFnCall = () => utils.getDocumentIdFromRequest({ path: '/foo/bar-baz' });

  t.equals(
    utils.getDocumentIdFromRequest({ path: '/consortia/csrtm-id' }),
    'csrtm-id',
    'consortiumId from consortia request'
  );
  t.throws(
    makeBadFnCall,
    /Could not resolve documentId from request/,
    'throws error on invalid resource path'
  );
});
