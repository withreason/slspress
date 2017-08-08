'use strict';

const ContainerManager = require('./container/container-manager');
const MiddlewareApplicator = require('./middleware-applicator');

const flattenArrays = require('./flatten-arrays');
const simpleErrorHandler = require('./simple-error-handler');

const loggerFactory = require('./logger-factory');

module.exports.any = 'any';
module.exports.source = {
  http: 'http',
  cron: 'cron',
  authorizer: 'auth',
  unknown: 'unknown'
};

module.exports.create = (applicationConfig, handlerName, customLogger) => {

  function creteRoutedHandler(routeKey, routeConfig) {
    const headers = applicationConfig.find(handlerName, 'headers', routeConfig._config).reduce((result, headers) => Object.assign(result, headers), {});
    const errorHandler = applicationConfig.find(handlerName, 'onError', routeConfig._config)[0] || simpleErrorHandler;
    const middlewares = flattenArrays(applicationConfig.find(handlerName, 'middlewares', routeConfig._config));

    const logger = loggerFactory(`slspress/${handlerName}/${routeKey}`, customLogger);
    const containerManager = new ContainerManager(applicationConfig.find(handlerName, 'component', routeConfig._config), customLogger);
    const thisContext = {
      component: name => containerManager.container.fetch(name),
      logger: logger
    };

    let requestMiddleware = middlewares.filter(m => m.middlewareType === 'request').map(m => m.value);
    let responseMiddleware = middlewares.filter(m => m.middlewareType === 'response').map(m => m.value);
    let finallyMiddleware = middlewares.filter(m => m.middlewareType === 'finally').map(m => m.value);
    requestMiddleware = flattenArrays([containerManager.startContainer].concat(requestMiddleware));
    responseMiddleware = flattenArrays(responseMiddleware);
    finallyMiddleware = flattenArrays([containerManager.stopContainer].concat(finallyMiddleware));

    const extendedHandler = (event, context, callback, req, res) => {
      switch (routeConfig._type) {
        case 'raw':
          const convertCallback =  (error, resposnse) => callback(error, res._updateFromRawHandlerResponse(error, resposnse));
          return routeConfig._handlerFunction.call(thisContext, event, context, convertCallback);
        case 'auth':
          return routeConfig._handlerFunction.call(thisContext, event, context, callback);
        case 'reqres':
          return routeConfig._handlerFunction.call(thisContext, req, res);
        default:
          throw new Error(`Unrecognised handler type ${routeConfig._type}`);
      }
    };

    return new MiddlewareApplicator(errorHandler, thisContext, headers, customLogger)
      .apply(extendedHandler, requestMiddleware, responseMiddleware, finallyMiddleware);
  }

  const routeHandlerByKey = {};
  applicationConfig.find(handlerName, 'route').forEach(({ source, path, method, routeConfig }) => {
    const routeKey = `${source}.${path}.${method}`;
    routeHandlerByKey[routeKey] = creteRoutedHandler(routeKey, routeConfig);
  });

  const logger = loggerFactory(__filename, customLogger);

  return (event, context, callback) => {
    try {
      const source =
        event.httpMethod ? module.exports.source.http
          : event['detail-type'] === 'Scheduled Event' ? module.exports.source.cron
          : event['type'] === 'TOKEN' ? module.exports.source.authorizer
            : module.exports.source.unknown;
      const path = source === module.exports.source.http ? event.resource.toLowerCase() : module.exports.any;
      const method = source === module.exports.source.http ? event.httpMethod.toUpperCase() : module.exports.any;

      let routeHandler = routeHandlerByKey[`${source}.${path}.${method}`];
      if (!routeHandler) {
        routeHandler = routeHandlerByKey[`${source}.${path}.${module.exports.any}`];
      }
      if (!routeHandler) {
        routeHandler = routeHandlerByKey[`${source}.${module.exports.any}.${module.exports.any}`];
      }
      if (!routeHandler) {
        routeHandler = routeHandlerByKey[`${module.exports.any}.${module.exports.any}.${module.exports.any}`];
      }
      if (!routeHandler) {
        logger.error(`Failed to find route matching ${source}.${path}.${method}`);
        return callback(null, { statusCode: 404 });
      }
      return routeHandler.call(routeHandler, event, context, callback);
    } catch (err) {
      logger.error('Unexpected error while selecting route', err);
      callback(err);
    }
  };
};