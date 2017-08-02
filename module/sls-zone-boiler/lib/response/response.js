'use strict';
/**
 * Simple data object class to store response information and to be able to call a serverless callback with it.
 */
class Response {
  constructor(statusCode, headers, body) {
    this._statusCode = statusCode;
    this._headers = headers;
    this._body = body;
  }

  /**
   * Sends the response by calling the given callback lambda with the information this was constructed with.
   * @param callback the serverless callback function.
   */
  send(callback) {
    return callback(null, {
      statusCode: this._statusCode,
      headers: this._headers,
      body: this._body
    });
  }
}

module.exports = Response;