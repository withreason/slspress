'use strict';

const containerMould = require('../../..');
const environment = require('./environment');
const ExampleCustomErrorHandler = require('./example-custom-error-handler');

const customResponseFactory = new containerMould.ResponseFactory().withHeaders({
  'Content-Type': 'application/vnd.api+json',
  'Api-Version': '1.0.0'
});

module.exports = new containerMould.Application(environment)
  .with('authorizer', require('./handlers/example-authorizer'))
  .with(customResponseFactory)
  .with(new ExampleCustomErrorHandler(customResponseFactory))

  .withComponentDir('components', `${__dirname}/components`, true)

  .with(containerMould.LogRequestMiddleware, containerMould.LogResponseMiddleware)
  .with(containerMould.ParseJsonBodyMiddleware, containerMould.SringifyResponseMiddleware)
  .with(containerMould.DecodePathParamsMiddleware)

  .with('container-handler', require('./middleware/example-container-middleware'), require('./handlers/example-container-handler'))

  .with('routing-handler', new containerMould.RoutingHandlerBuilder()
    .withRoute('/routing/stuff/{id}', 'GET', require('./handlers/example-container-handler'))
    .build())

  .getHandlers();