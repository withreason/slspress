'use strict';

const validateHeadersObject = require('./validate-headers-object');

/**
 * An object that is used to send back responses.
 *
 * usage:
 *
 * res.ok(body);
 *
 * or
 *
 * res.send(200, body);
 *
 * or
 *
 * res.addHeaders({'custom-header': 'test'}).noContent();
 *
 * It can also be used to forward errors to the error handler as follows:
 *
 * res.handleError(errorObject);
 */
module.exports = function(req, callback, errorHandlingFn, headers, statusCode, body, error) {

  const _headers = Object.assign({}, headers);
  let _statusCode = statusCode;
  let _body = body;
  let _sent = false;
  let _inResponseMiddleware = false;

  Object.defineProperty(this, 'headers', { get: () => _headers });
  Object.defineProperty(this, 'statusCode', { get: () => _statusCode });
  Object.defineProperty(this, 'body', { get: () => _body });
  Object.defineProperty(this, 'error', { get: () => error });
  Object.defineProperty(this, '_inResponseMiddleware', { get: () => _inResponseMiddleware, set: val => _inResponseMiddleware = val });

  /**
   * Add some headers to the response.
   * @param headers a string string map object of headers. e.g. {'custom-header': 'test'}
   * @returns {Response} this response object for chaining.
   */
  this.addHeaders = (headers) => {
    Object.assign(_headers, validateHeadersObject(headers));
    return this;
  };

  function calculateStatus(body) {
    if (body === undefined || body === null) {
      return 204;
    }
    if (req.event.httpMethod.toUpperCase() === 'POST') {
      return 201;
    }
    return 200;
  }

  /**
   * Send a response to the caller.
   * @param var_args - no args for a no content(204) no body response
   *                 - single arg for either a 200 or 201 response where the body is the given arg. (The response will be 201 for a post request and 200 for any other request)
   *                 - two args (statusCode, body) to send back the given status and body.
   * @returns {*}
   */
  this.send = function(var_args) {
    if (_sent) {
      throw new Error('The response has already been sent. You should not send a response twice.');
    }
    if (arguments.length === 2) {
      _statusCode = arguments[0];
      _body = arguments[1];
    } else {
      _body = arguments[0];
      _statusCode = calculateStatus(_body);
    }
    _sent = true;

    const middlewareResponse = new (Object.getPrototypeOf(this).constructor)(req, callback, errorHandlingFn, _headers, _statusCode, _body, null);
    middlewareResponse._inResponseMiddleware = true;
    return callback(null, middlewareResponse);
  };

  /**
   * Send an 200(ok) response.
   * @param body optional body to return
   */
  this.ok = (body) => this.send(200, body);

  /**
   * Send an 201(created) response.
   * @param body optional body to return
   */
  this.created = (body) => this.send(201, body);

  /**
   * Send an 204(no content) response.
   */
  this.noContent = () => this.send(204, undefined);

  /**
   * Send an 400(bad request) response.
   * @param body optional body to return
   */
  this.badRequest = (body) => this.send(400, body);

  /**
   * Send an 401(unauthorised) response.
   * @param body optional body to return
   */
  this.unauthorised = (body) => this.send(401, body);

  /**
   * Send an 403(forbidden) response.
   * @param body optional body to return
   */
  this.forbidden = (body) => this.send(403, body);

  /**
   * Send an 404(not found) response.
   * @param body optional body to return
   */
  this.notFound = (body) => this.send(404, body);

  /**
   * Send an 422(unprocessable entity) response.
   * @param body optional body to return
   */
  this.unprocessableEntity = (body) => this.send(422, body);

  /**
   * Send an 500(internal server error) response.
   * @param body optional body to return
   */
  this.internalServerError = (body) => this.send(500, body);

  /**
   * Update the response object after it has bee 'sent'. This can not be used from handlers. It should only be used in
   * response middleware which needs to manipulate the response before it is sent to the serverless callback
   * @param var_args - single arg to replace the body with the given argument.
   *                 - two args (statusCode, body) to replace with the given status and body.
   */
  this.update = function(var_args) {
    if (!_inResponseMiddleware) {
      throw new Error('The update method can only be used to update the response in the response middleware and not inside a handler.');
    }
    if (arguments.length === 2) {
      _statusCode = arguments[0];
      _body = arguments[1];
    } else {
      _body = arguments[0];
    }
  };

  /**
   * Indicate there was an error processing the request and forward to the error handler.
   * Calling this with an error object is the same as throwing from middleware or handler functions but this can also be used from a promise catch block.
   * @param error the error that occurred.
   */
  this.handleError = error => errorHandlingFn(error, req, this);

  this._createErrorResponse = (error, finallyCallback) => {
    return new (Object.getPrototypeOf(this).constructor)(req, finallyCallback, errorHandlingFn, _headers, _statusCode, _body, error);
  };

  this._createFromRawHandlerResponse = (error, rawResponse) => {
    const newResponse = new (Object.getPrototypeOf(this).constructor)(req, callback, errorHandlingFn,
      rawResponse && rawResponse.headers || _headers,
      rawResponse && rawResponse.statusCode || _statusCode,
      rawResponse && rawResponse.body || _body,
      error);
    newResponse._inResponseMiddleware = true;
    return newResponse;
  };
};