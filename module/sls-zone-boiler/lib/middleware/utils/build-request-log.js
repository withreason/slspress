'use strict';

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

module.exports = (event, objectContainingBody) => {
  const user = extractUser(event);
  const path = extractPath(event);
  const queryParams = extractQueryParams(event);
  const headers = stringifyHeaders(objectContainingBody);
  const body = stringifyBody(objectContainingBody);

  return `user=${user} path=${path} queryParams=${queryParams}\n  headers=${headers}\n  body=${body}\n`
};