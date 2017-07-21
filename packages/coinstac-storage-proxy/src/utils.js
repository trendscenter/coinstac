'use strict';

const axios = require('axios');
const url = require('url');
const path = require('path');

const consortiaRegex = new RegExp('consortia/([^/]+)');
const documentIdRegex = new RegExp('(consortia|consortium-[^/]+)/([^/]+)');

/**
 * get the port of the current request
 * @param  {object} request
 * @return {number}
 */
const getPort = (request) => {
  const host = (request.info && request.info.host) || '';
  const requestPortMatches = host.match(/:(\d+$)/);
  if (requestPortMatches && requestPortMatches.length > 1) {
    return parseInt(requestPortMatches[1], 10);
  }

  return parseInt((request.server.info && request.server.info.port) || 80, 10);
};

/**
 * get URL to forward to if request is unauthorized
 * @param  {object} request the request object being rejected
 * @param  {string} msg     the rejection message
 * @return {string}         fully formed URL
 */
const getUnauthorizedUrl = (request, msg) => {
  const port = getPort(request);
  return url.format({
    protocol: 'http',
    hostname: 'localhost',
    port,
    pathname: 'unauthorized',
    query: { msg },
  });
};

/**
 * get the url that the request should be forwarded to
 * @param  {object} request
 * @return {string}
 */
const getTargetUrl = (targetBaseUrl, request) => {
  const urlObj = Object.assign({}, targetBaseUrl);
  const deDiredPath = request.path.replace(/coinstacdb\/?(up|down)?\/?/, '');
  const targetPath = url.parse(deDiredPath).pathname;
  const query = request.query || {};
  urlObj.pathname = path.join(urlObj.pathname, targetPath);
  urlObj.query = Object.assign({}, urlObj.query, query);

  return url.format(urlObj);
};

/**
 * derive document ID from request URL
 * @param  {object} request  hapi request object
 * @return {string}          document ID
 */
const getDocumentIdFromRequest = (request) => {
  const pathname = request.path;
  const match = pathname.match(documentIdRegex);
  if (match) {
    return match[2];
  }
  throw new Error('Could not resolve documentId from request');
};

/**
 * derive consortium ID from request URL
 * @param  {object} request  hapi request object
 * @return {string}          consortiumId
 */
const getConsortiumIdFromRequest = (request) => {
  const pathname = request.path;
  let id;
  if (pathname.match(consortiaRegex)) {
    id = getDocumentIdFromRequest(request);
  } else {
    throw new Error('Could not resolve consortiumId from request');
  }

  return id;
};

/**
 * get consortium metadata from datastore
 * @param  {string} targetUrl
 * @param  {object} consortiumId hapi request object
 * @return {Promise}             resolves to consortium object
 */
const getConsortium = (targetUrl, request) => {
  const consortiumId = getConsortiumIdFromRequest(request);
  const urlPath = path.join(targetUrl.pathname, 'consortia', consortiumId);
  const uri = url.format(Object.assign({}, targetUrl, { pathname: urlPath }));
  return axios.get(uri)
  .then(response => response.data);
};

module.exports = {
  getConsortiumIdFromRequest,
  getDocumentIdFromRequest,
  getConsortium,
  getTargetUrl,
  getUnauthorizedUrl,
  getPort,
};
