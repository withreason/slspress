'use strict';

module.exports = Object.assign(module.exports, require('./lib/config/application-config-wrappers'));
module.exports.create = () => new (require('./lib/app'));

const routingHandlerFactory = require('./lib/routing-handler-factory');
module.exports.any = routingHandlerFactory.any;
module.exports.source = routingHandlerFactory.source;

module.exports.Component = require('./lib/container/component');

module.exports.ApplicationError = require('./lib/error/application-error');
module.exports.BadRequestError = require('./lib/error/bad-request-error');
module.exports.NotFoundError = require('./lib/error/not-found-error');
module.exports.UnprocessableEntityError = require('./lib/error/unprocessable-entity-error');

module.exports.createAuthorizerResponse = require('./lib/authorizer/create-authorizer-resonse');
module.exports.createLogger = require('./lib/logger-factory');

module.exports.jsonMiddleware = require('./lib/middleware/json');
module.exports.loggingMiddleware = require('./lib/middleware/logging');
module.exports.pathParamsMiddleware = require('./lib/middleware/path-params');
