'use strict';

module.exports.Application = require('./lib/application');
module.exports.Response = require('./lib/response/response');
module.exports.ResponseFactory = require('./lib/response/response-factory');

module.exports.ApplicationError = require('./lib/error/application-error');
module.exports.BadRequestError = require('./lib/error/bad-request-error');
module.exports.NotFoundError = require('./lib/error/not-found-error');

module.exports.ErrorHandler = require('./lib/error/error-handler');
module.exports.SimpleErrorHandler = require('./lib/error/simple-error-handler');

module.exports.Container = require('./lib/container/container');
module.exports.Component = require('./lib/container/component');
module.exports.ContainerHandler = require('./lib/handlers/container-handler');

module.exports.Middleware = require('./lib/middleware/middleware');
module.exports.RequestMiddleware = require('./lib/middleware/request-middleware');
module.exports.ResponseMiddleware = require('./lib/middleware/response-middleware');
module.exports.FinallyMiddleware = require('./lib/middleware/finally-middleware');
module.exports.ContainerRequestMiddleware = require('./lib/middleware/container-request-middleware');
module.exports.ContainerResponseMiddleware = require('./lib/middleware/container-response-middleware');
module.exports.ContainerFinallyMiddleware = require('./lib/middleware/container-finally-middleware');

module.exports.LogRequestMiddleware = require('./lib/middleware/request/log');
module.exports.ParseJsonBodyMiddleware = require('./lib/middleware/request/parse-json-body');
module.exports.DecodePathParamsMiddleware = require('./lib/middleware/request/decode-path-params');
module.exports.LogResponseMiddleware = require('./lib/middleware/finally/log');
module.exports.SringifyResponseMiddleware = require('./lib/middleware/response/stringify');

module.exports.createAuthorizerResponse = require('./lib/authorizer/create-authorizer-resonse');
module.exports.logger = require('./lib/logger');

//TODO remove once integrated
module.exports.RoutingHandlerBuilder = require('./lib/handlers/routing-handler-builder');
