'use strict';

const mould = require('../../..');

const customResponseFactory = new mould.ResponseFactory().withHeaders({
  'Content-Type': 'application/vnd.api+json',
  'Api-Version': '1.0.0'
});

module.exports = new mould.Application()
  .with('simpleHandler', require('./handlers/simple-handler'))

  .with(customResponseFactory)
  .with(mould.LogRequestMiddleware, mould.LogResponseMiddleware)
  .with(mould.ParseJsonBodyMiddleware)
  .with('jsonPromiseHandler', require('./handlers/json-promise-handler'), mould.SringifyResponseMiddleware)

  .getHandlers();