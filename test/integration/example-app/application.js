'use strict';

const boilerplate = require('../../..');

const customResponseFactory = new boilerplate.ResponseFactory().withHeaders({
  'Content-Type': 'application/vnd.api+json',
  'Api-Version': '1.0.0'
});

module.exports = new boilerplate.Application()
  .with('simpleHandler', require('./handlers/simple-handler'))

  .with(customResponseFactory)
  .with(boilerplate.LogRequestMiddleware, boilerplate.LogResponseMiddleware)
  .with(boilerplate.ParseJsonBodyMiddleware)
  .with('jsonPromiseHandler', require('./handlers/json-promise-handler'), boilerplate.SringifyResponseMiddleware)

  .getHandlers();