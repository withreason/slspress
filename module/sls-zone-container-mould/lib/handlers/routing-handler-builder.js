'use strict';

const ContainerHandler = require('./container-handler');
const NotFoundError = require('sls-zone-mould').NotFoundError;

class RoutingHandler extends ContainerHandler {
  constructor(container) {
    super(container);

    this._routeClass = null;
    this._container = container;
  }

  validate() {
    const routeKey = `${this._event.resource.toLowerCase()}.${this._event.httpMethod.toUpperCase()}`;
    const route = this._getRoutes()[routeKey];

    if (!route) {
      return Promise.reject(new NotFoundError(`route matching ${routeKey}`));
    }
    this._routeClass = route;
    return Promise.resolve();
  }

  process() {
    const instance = new this._routeClass(this._container);
    return instance.validate().then(() => instance.process());
  }

  _getRoutes() {
    return {};
  }
}

class RoutingHandlerBuilder {
  constructor() {
    this._routes = {};
  }

  withRoute(path, method, containerHandler) {
    const route = `${path.toLowerCase()}.${method.toUpperCase()}`;
    if (this._routes[route]) {
      throw new Error(`The route ${route} already exists`);
    }
    if (!ContainerHandler.isPrototypeOf(containerHandler)) {
      throw new Error('The provided containerHandler must extends from ContainerHandler');
    }
    this._routes[route] = containerHandler;
    return this;
  }

  build() {
    const outer = this;
    return class extends RoutingHandler {
      _getRoutes() {
        return outer._routes;
      }
    }
  }
}

module.exports = RoutingHandlerBuilder;