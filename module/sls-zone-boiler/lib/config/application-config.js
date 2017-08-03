'use strict';

const RouteConfig = require('./route-config');
const RouteHandlerConfig = require('./route-handler-config');
const configWrappers = require('./application-config-wrappers');
const routingHandlerFactory = require('../routing-handler-factory');

const DEFAULT_HANDLER_WRAPPER = configWrappers.handler;
const HANDLER_WRAPPERS_BY_SOURCE = {};
HANDLER_WRAPPERS_BY_SOURCE[routingHandlerFactory.source.authorizer] = configWrappers.authorizerHandler;
HANDLER_WRAPPERS_BY_SOURCE[routingHandlerFactory.source.cron] = configWrappers.cronHandler;

function getHandlerWrapper(source) {
  return HANDLER_WRAPPERS_BY_SOURCE[source] || DEFAULT_HANDLER_WRAPPER;
}

class ApplicationConfig extends RouteConfig{
  constructor(customLogger) {
    super(customLogger);
  }

  get handlerNames() {
    return Object.keys(this.handlerConfig);
  }

  use(var_args) {
    const { handlerName, args } = this._processArgsForNoOverride('use', arguments);
    if (args.length < 1 ||  args.length > 2) {
      throw new Error('use must be given one or two arguments, the handler function to use or the event source followed by the handler function');
    }
    let source = routingHandlerFactory.any;
    let handler = args[0];
    if (args.length === 2 ) {
      source =  args[0];
      handler =  args[1];
    }

    this._route(handlerName, source, routingHandlerFactory.any, routingHandlerFactory.any, handler);
  }

  httpRoute(var_args) {
    const { handlerName, args } = this._processArgsForNoOverride('use', arguments);
    if (args.length !== 3) { // yes 3 vs 2. Its correct... ;) We add a extra method param where they are defined on the handler
      throw new Error('expected two arguments, the path and the handler');
    }
    const method = args[0];
    const path = args[1];
    const handler = args[2];
    if (typeof path !== 'string') {
      throw new Error('The first argument must be a string, the path to apply the handler to.');
    }
    this._route(handlerName, routingHandlerFactory.source.http, path, method, handler);
  }

  _route(handlerName, source, path, method, handler) {
    if (!(handler instanceof RouteHandlerConfig) && typeof handler !== 'function') {
      throw new Error('The handler provided must be a function or a function wrapped in "handler" or "rawHandler"');
    }
    const routeConfig = handler instanceof RouteHandlerConfig ? handler : getHandlerWrapper(source)(handler);
    this._add(handlerName, 'route', false, { source, path, method, routeConfig });
  }
}

module.exports = ApplicationConfig;