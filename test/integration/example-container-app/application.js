'use strict';

const boilerplate = require('../../../container-index');
const environment = require('./environment');
const ExampleCustomErrorHandler = require('./example-custom-error-handler');

const customResponseFactory = new boilerplate.ResponseFactory().withHeaders({
  'Content-Type': 'application/vnd.api+json',
  'Api-Version': '1.0.0'
});

module.exports = new boilerplate.Application(environment)
  .with('authorizer', require('./handlers/example-authorizer'))
  .with(customResponseFactory)
  .with(new ExampleCustomErrorHandler(customResponseFactory))

  .withComponentDir('components', `${__dirname}/components`, true)

  .with(boilerplate.LogRequestMiddleware, boilerplate.LogResponseMiddleware)
  .with(boilerplate.ParseJsonBodyMiddleware, boilerplate.SringifyResponseMiddleware)
  .with(boilerplate.DecodePathParamsMiddleware)

  .with('container-handler', require('./handlers/example-container-handler'))

  .with('routing-handler', new boilerplate.RoutingHandlerBuilder()
    .withRoute('/routing/stuff/{id}', 'GET', require('./handlers/example-container-handler'))
    .build())

  .getHandlers();