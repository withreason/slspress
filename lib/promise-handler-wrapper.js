'use strict';

const Response = require('./response/response');

class PromiseHandlerWrapper {
  constructor(responseFactory) {
    this._responseFactory = responseFactory;
  }

  wrapToHandlePromiseResult(handler) {
    return (event, context, callback) => {
      const result = handler(event, context, callback);
      if (!result || !result.then) {
        return;
      }
      return result.then(response => {
        if (!(response instanceof Response)) {
          response = this._convertBodyToResponse(event, response)
        }
        return response.send(callback);
      });
    };
  }

  _convertBodyToResponse(event, response) {
    return !response ? this._responseFactory.noContent() :
      event.httpMethod.toUpperCase() === 'POST' ? this._responseFactory.created(response) : this._responseFactory.ok(response);
  }
}

module.exports = PromiseHandlerWrapper;