'use strict';

const sinon = require('sinon');
const chai = require('chai');
chai.use(require('sinon-chai'));
const expect = chai.expect;

const cloneDeep = require('clone-deep');

const MiddlewareApplicator = require('../../lib/middleware-applicator');

describe('MiddlewareApplicator', () => {

  let event, context, callback;
  let subject, errorHandler, thisContext, headers, logger;
  let extendedHandler, capturedHandlerRequest, capturedHandlerResponse;
  let middlewareCalls, middleware1, middleware2, middleware3, throwingMiddleware, middlewareError;
  let capturingMiddleware, capturedMiddlewareRequest, capturedMiddlewareResponse;

  beforeEach(() => {
    errorHandler = sinon.spy((req, res) => res.internalServerError());
    thisContext = { some: 'this' };
    headers = { some: 'header'};
    logger = { error: sinon.spy(), warn: sinon.spy(), log: sinon.spy() };

    extendedHandler = sinon.spy((event, context, callback, req, res) => {
      middlewareCalls.push('handler');
      // we need to capture them hear because they mutate
      capturedHandlerRequest = cloneDeep(req);
      capturedHandlerResponse = res._createErrorResponse(res.error); // sort of clone...
      return res.noContent();
    });

    subject = new MiddlewareApplicator(errorHandler, thisContext, headers, logger);

    event = { some: 'event' };
    context = { some: 'context' };
    callback = sinon.spy();

    middlewareCalls = [];
    const createMiddleware = name => sinon.spy((req, res, next) => { middlewareCalls.push(name); return next() });
    middleware1 = createMiddleware('middleware1');
    middleware2 = createMiddleware('middleware2');
    middleware3 = createMiddleware('middleware3');

    middlewareError = new Error('throwingMiddleware');
    throwingMiddleware = () => {
      middlewareCalls.push('throwingMiddleware');
      throw middlewareError
    };

    capturingMiddleware = sinon.spy((req, res) => {
      middlewareCalls.push('capturingMiddleware');
      // we need to capture them hear because they mutate
      capturedMiddlewareRequest = cloneDeep(req);
      capturedMiddlewareResponse = res._createErrorResponse(res.error); // sort of clone...
      return next();
    });
  });

  function validateReqRes(req, res, statusCode) {
    expect(req.event).to.eql(event);
    expect(req.context).to.eql(context);
    expect(res.headers).to.eql(headers);
    expect(res.statusCode).to.equal(statusCode);
    expect(!!res.body).to.be.false;
    expect(!!res.error).to.be.false;
  }

  describe('handler', () => {
    it('should be invoked', () => {
      const handler = subject.apply(extendedHandler, [], [], []);
      handler(event, context, callback);

      expect(extendedHandler).to.have.been.called;
    });

    it('callback should be invoked', () => {
      const handler = subject.apply(extendedHandler, [], [], []);
      handler(event, context, callback);

      expect(callback).to.have.been.calledOnce;
      expect(callback.getCall(0).args[0]).to.be.null;
      expect(callback.getCall(0).args[1].body).to.be.undefined;
      expect(callback.getCall(0).args[1].statusCode).to.equal(204);
      expect(callback.getCall(0).args[1].headers).to.eql(headers);
    });

    it('should have access to this context', () => {
      const handler = subject.apply(extendedHandler, [], [], []);
      handler(event, context, callback);

      expect(extendedHandler).to.have.been.calledOn(thisContext);
    });

    it('should have access to the original function objects as well as the request and response', () => {
      const handler = subject.apply(extendedHandler, [], [], []);
      handler(event, context, callback);

      expect(extendedHandler).to.have.been.called;
      const args = extendedHandler.getCall(0).args;
      expect(args[0]).to.eql(event);
      expect(args[1]).to.eql(context);
      expect(args[2]).not.to.be.undefined;
      validateReqRes(capturedHandlerRequest, capturedHandlerResponse);
    });
  });

  describe('request middleware', () => {
    it('should be called in the order given before the handler', () => {
      const handler = subject.apply(extendedHandler, [middleware1, middleware2, middleware3], [], []);
      handler(event, context, callback);
      expect(middlewareCalls).to.eql(['middleware1', 'middleware2', 'middleware3', 'handler']);
    });

    it('call chain should stop if middleware throws and error handler should be invoked with error', () => {
      const handler = subject.apply(extendedHandler, [middleware1, throwingMiddleware, middleware2], [], []);
      handler(event, context, callback);
      expect(middlewareCalls).to.eql(['middleware1', 'throwingMiddleware']);
      expect(errorHandler).to.have.been.calledOnce;
      expect(errorHandler.getCall(0).args[0]).to.eql({ event, context});
      expect(errorHandler.getCall(0).args[1].error).to.eql(middlewareError);
    });

    it('should have access to this context', () => {
      const handler = subject.apply(extendedHandler, [middleware1], [], []);
      handler(event, context, callback);

      expect(middleware1).to.have.been.calledOn(thisContext);
    });

    it('default request and response information should be set', () => {
      const handler = subject.apply(extendedHandler, [capturingMiddleware], [], []);
      handler(event, context, callback);

      expect(capturingMiddleware).to.have.been.called;
      validateReqRes(capturedMiddlewareRequest, capturedMiddlewareResponse);
    });
  });

  describe('response middleware', () => {
    it('should be called in the reverse order given after the handler', () => {
      const handler = subject.apply(extendedHandler, [], [middleware1, middleware2, middleware3], []);
      handler(event, context, callback);
      expect(middlewareCalls).to.eql(['handler', 'middleware3', 'middleware2', 'middleware1']);
    });

    it('call chain should stop if middleware throws and error handler should be invoked with error', () => {
      const handler = subject.apply(extendedHandler, [], [middleware1, throwingMiddleware, middleware2], []);
      handler(event, context, callback);
      expect(middlewareCalls).to.eql(['handler','middleware2', 'throwingMiddleware']);
      expect(errorHandler).to.have.been.calledOnce;
      expect(errorHandler.getCall(0).args[0]).to.eql({ event, context});
      expect(errorHandler.getCall(0).args[1].error).to.eql(middlewareError);
    });

    it('should have access to this context', () => {
      const handler = subject.apply(extendedHandler, [], [middleware1], []);
      handler(event, context, callback);

      expect(middleware1).to.have.been.calledOn(thisContext);
    });

    it('default request and response information should be set', () => {
      const handler = subject.apply(extendedHandler, [], [capturingMiddleware], []);
      handler(event, context, callback);

      expect(capturingMiddleware).to.have.been.called;
      validateReqRes(capturedMiddlewareRequest, capturedMiddlewareResponse, 204);
    });
  });

  describe('finally middleware', () => {
    it('should be called in the reverse order given after the handler and response middleware', () => {
      const handler = subject.apply(extendedHandler, [], [middleware1], [middleware2, middleware3]);
      handler(event, context, callback);
      expect(middlewareCalls).to.eql(['handler', 'middleware1', 'middleware3', 'middleware2']);
    });

    it('should have access to this context', () => {
      const handler = subject.apply(extendedHandler, [], [], [middleware1]);
      handler(event, context, callback);

      expect(middleware1).to.have.been.calledOn(thisContext);
    });

    it('default request and response information should be set', () => {
      const handler = subject.apply(extendedHandler, [], [], [capturingMiddleware]);
      handler(event, context, callback);

      expect(capturingMiddleware).to.have.been.called;
      validateReqRes(capturedMiddlewareRequest, capturedMiddlewareResponse, 204);
    });

    it('should still be executed if request middleware throws', () => {
      const handler = subject.apply(extendedHandler, [throwingMiddleware], [], [middleware1]);
      handler(event, context, callback);
      expect(middlewareCalls).to.eql(['throwingMiddleware', 'middleware1']);
    });

    it('should still be executed if handler throws', () => {
      const throwingHandler = () => {
        middlewareCalls.push('throwingHandler');
        throw middlewareError;
      };
      const handler = subject.apply(throwingHandler, [], [], [middleware1]);
      handler(event, context, callback);
      expect(middlewareCalls).to.eql(['throwingHandler', 'middleware1']);
    });

    it('should still be executed if response middleware throws', () => {
      const handler = subject.apply(extendedHandler, [], [throwingMiddleware], [middleware1]);
      handler(event, context, callback);
      expect(middlewareCalls).to.eql(['handler', 'throwingMiddleware', 'middleware1']);
    });

    it('should still be executed if earlier other finally middleware throws', () => {
      const handler = subject.apply(extendedHandler, [], [], [middleware1, throwingMiddleware, middleware2]);
      handler(event, context, callback);
      expect(middlewareCalls).to.eql(['handler', 'middleware2', 'throwingMiddleware', 'middleware1']);
    });

    it('should log if finally middleware throws', () => {
      const handler = subject.apply(extendedHandler, [], [], [middleware1, throwingMiddleware, middleware2]);
      handler(event, context, callback);
      expect(logger.error).to.have.been.calledWithExactly(
        'Finally middleware threw an error. Ignoring and proceeding with other finallys.',
        middlewareError);
    });
  });

  describe('error handler', () => {

    function validateReqRes(req, res) {
      expect(req.event).to.eql(event);
      expect(req.context).to.eql(context);
      expect(res.headers).to.eql(headers);
      expect(res.statusCode).to.equal(500);
      expect(!!res.body).to.be.false;
      expect(res.error).to.eql(middlewareError);
    }

    it('should be able to access the this context', () => {
      const handler = subject.apply(extendedHandler, [throwingMiddleware], [], []);
      handler(event, context, callback);
      expect(errorHandler).to.have.been.calledOnce;
      expect(errorHandler).to.have.been.calledOn(thisContext);
    });

    it('should be able to access the request and response', () => {
      const handler = subject.apply(extendedHandler, [throwingMiddleware], [], []);
      handler(event, context, callback);
      expect(errorHandler).to.have.been.calledOnce;
      validateReqRes(errorHandler.getCall(0).args[0], errorHandler.getCall(0).args[1]);
    });

    it('should be invoked when the handle error function is used', () => {
      const handler = subject.apply(extendedHandler, [(req, res) => res.handleError(middlewareError)], [], []);
      handler(event, context, callback);
      expect(errorHandler).to.have.been.calledOnce;
      validateReqRes(errorHandler.getCall(0).args[0], errorHandler.getCall(0).args[1]);
    });

    it('should catch error handler errors and invoke callback with them', () => {
      const error = new Error('Bang!');
      errorHandler = () => { throw error; };
      subject = new MiddlewareApplicator(errorHandler, thisContext, headers, logger);

      const handler = subject.apply(extendedHandler, [throwingMiddleware], [], []);
      handler(event, context, callback);

      expect(callback).to.have.been.calledWithExactly(error);
      expect(logger.error).to.have.been.calledWithExactly('Unexpected error while applying middleware.', error);
    });
  });
});