'use strict';

const { create, handler, jsonMiddleware, loggingMiddleware, pathParamsMiddleware, BadRequestError } = require('../../..');

const app = create()
  .headers({
    'Content-Type': 'application/json',
    'Api-Version': '1.0.0'
  })
  .onError(require('./example-custom-error-handler'))
  .component('environment', require('./environment'))
  .componentDir('components', `${__dirname}/components`, true)
  .middleware(jsonMiddleware, loggingMiddleware, pathParamsMiddleware);


app.on('simpleHandler').use(require('./handlers/simple-handler'));

app.on('authorizer').authorizer(require('./handlers/example-authorizer'));

app.on('container-handler')
  .middleware(require('./middleware/validate-id'))
  .use(require('./handlers/example-container-handler'));

app.on('routing-handler')
  .get('/routing/examples',(req, res) => res.ok('Example get handler response'))
  .post('/routing/examples',
    handler((req, res) => res.created(req.event.body))
      .middleware(function(req, res, next) {
        if (!req.event.body) {
          throw new BadRequestError();
        }
        return next();
      })
  );

module.exports = app.export();