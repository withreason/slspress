'use strict';

const boiler = require('../../..');
const environment = require('./environment');
const ExampleCustomErrorHandler = require('./example-custom-error-handler');

const customResponseFactory = new boiler.ResponseFactory().withHeaders({
  'Content-Type': 'application/json',
  'Api-Version': '1.0.0'
});

module.exports = new boiler.Application(environment)
  .with('simpleHandler', require('./handlers/simple-handler'))

  .with('authorizer', require('./handlers/example-authorizer'))
  .with(customResponseFactory)
  .with(new ExampleCustomErrorHandler(customResponseFactory))

  .withComponentDir('components', `${__dirname}/components`, true)

  .with(boiler.LogRequestMiddleware, boiler.LogResponseMiddleware)
  .with(boiler.ParseJsonBodyMiddleware, boiler.SringifyResponseMiddleware)
  .with(boiler.DecodePathParamsMiddleware)

  .with('jsonPromiseHandler', require('./handlers/json-promise-handler'))

  .with('container-handler', require('./middleware/example-container-middleware'), require('./handlers/example-container-handler'))

  .with('routing-handler', new boiler.RoutingHandlerBuilder()
    .withRoute('/routing/stuff/{id}', 'GET', require('./handlers/example-container-handler'))
    .build())

  .getHandlers();