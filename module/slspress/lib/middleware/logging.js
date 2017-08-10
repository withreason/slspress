'use strict';

const wrappers = require('../config/route-config-wrappers');

function extractUser(event) {
  return event.requestContext && event.requestContext.authorizer && event.requestContext.authorizer.id;
}

function extractPath(event) {
  return `${event.httpMethod} ${event.path}`;
}

function extractQueryParams(event) {
  return event.queryStringParameters && JSON.stringify(event.queryStringParameters);
}

function stringifyBody(object) {
  let body =  object && object.body &&
    JSON.stringify((typeof object.body === 'string' ? JSON.parse(object.body) : object.body));
  if (body && body.length > 500) {
    body = body.substring(0, 500) + '...';
  }
  return body;
}

function stringifyHeaders(object) {
  let headers = object && object.headers;
  if (headers && headers['Authorization']) {
    headers['Authorization'] = '******';
  }
  return headers && JSON.stringify(headers);
}

function buildRequestLog(event, objectContainingBody) {
  const user = extractUser(event);
  const path = extractPath(event);
  const queryParams = extractQueryParams(event);
  const headers = stringifyHeaders(objectContainingBody);
  const body = stringifyBody(objectContainingBody);

  return `user=${user} path=${path} queryParams=${queryParams}\n  headers=${headers}\n  body=${body}\n`
}

/**
 * Returns middleware that ensures that each request and response is logged.
 */
module.exports = [
  wrappers.request(function(req, res, next) {
    this.logger.info(`START request. ${buildRequestLog(req.event, req.event)}`);
    return next();
  }),
  wrappers.final(function(req, res, next) {
    if (res.error) {
      this.logger.error(`ERROR processing request. error=${JSON.stringify(res.error)} status=${res.statusCode} ${buildRequestLog(req.event, res)}`);
    } else {
      this.logger.info(`COMPLETED request. status=${res.statusCode} ${buildRequestLog(req.event, res)}`);
    }
    return next();
  })
];