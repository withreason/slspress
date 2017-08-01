'use strict';

const Response = require('./response');

/**
 * Factory for response objects.
 *
 * usage:
 * ===
 *
 * new ResponseFactory().ok('Simple handler response').send(callback);
 *
 * With a custom headers:
 *
 * new ResponseFactory().withHeaders(headers).ok('Simple handler response').send(callback);
 */
class ResponseFactory {

  constructor() {
    this._headers = {
      'Content-Type': 'application/vnd.api+json'
    };
  }

  withHeaders(headers) {
    this._headers = headers;
    return this;
  }

  ok(body) {
    return this._createResponse(200, body);
  }

  created(body) {
    return this._createResponse(201, body);
  }

  noContent() {
    return this._createResponse(204);
  }

  badRequest(body) {
    return this._createResponse(400, body);
  }

  unauthorised(body) {
    return this._createResponse(401, body);
  }

  forbidden(body) {
    return this._createResponse(403, body);
  }

  notFound(body) {
    return this._createResponse(404, body);
  }

  unprocessableEntity(body) {
    return this._createResponse(422, body);
  }

  internalServerError(body) {
    return this._createResponse(500, body);
  }

  _createResponse(status, body) {
    return new Response(status, this._headers, body);
  }

}

module.exports = ResponseFactory;