'use strict';

module.exports = Object.assign({}, require('sls-zone-mould'));

module.exports.Application = require('./lib/container-application');
module.exports.Container = require('./lib/container/container');
module.exports.Component = require('./lib/container/component');
module.exports.ContainerHandler = require('./lib/handlers/container-handler');

module.exports.ContainerRequestMiddleware = require('./lib/middleware/container-request-middleware');
module.exports.ContainerResponseMiddleware = require('./lib/middleware/container-response-middleware');
module.exports.ContainerFinallyMiddleware = require('./lib/middleware/container-finally-middleware');

//TODO move to non container version
module.exports.RoutingHandlerBuilder = require('./lib/handlers/routing-handler-builder');
