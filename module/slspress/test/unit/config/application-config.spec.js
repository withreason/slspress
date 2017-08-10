'use strict';

const sinon = require('sinon');
const chai = require('chai');
chai.use(require('sinon-chai'));
const expect = chai.expect;

const ApplicationConfig = require('../../../lib/config/application-config');
const appConfigWrappers = require('../../../lib/config/application-config-wrappers');
const routeConfigWrappers = require('../../../lib/config/route-config-wrappers');

describe('ApplicationConfig', () => {

  let subject, extra, logger;

  beforeEach(() => {
    logger = { error: sinon.spy(), warn: sinon.spy(), log: sinon.spy() };
    subject = new ApplicationConfig(logger);
    extra = new ApplicationConfig(logger);
  });

  describe('use', () => {
    const handler1 = () => {};
    const handler2 = () => {};

    it('should append to existing config', () => {
      subject.use(null, handler1);
      subject.use('testHandler', handler2);

      const matchingConfig = subject.find('testHandler', 'route');
      expect(matchingConfig.length).to.equal(2);
      expect(matchingConfig[0].source).to.equal('any');
      expect(matchingConfig[0].path).to.equal('any');
      expect(matchingConfig[0].method).to.equal('any');
      expect(matchingConfig[0].routeConfig._type).to.equal('reqres');
      expect(matchingConfig[0].routeConfig._handlerFunction).to.equal(handler1);
      expect(matchingConfig[1].source).to.equal('any');
      expect(matchingConfig[1].path).to.equal('any');
      expect(matchingConfig[1].method).to.equal('any');
      expect(matchingConfig[1].routeConfig._type).to.equal('reqres');
      expect(matchingConfig[1].routeConfig._handlerFunction).to.equal(handler2);
    });

    it('should accept event source', () => {
      subject.use(null, 'src', handler1);

      const matchingConfig = subject.find('testHandler', 'route');
      expect(matchingConfig.length).to.equal(1);
      expect(matchingConfig[0].source).to.equal('src');
      expect(matchingConfig[0].path).to.equal('any');
      expect(matchingConfig[0].method).to.equal('any');
      expect(matchingConfig[0].routeConfig._type).to.equal('reqres');
      expect(matchingConfig[0].routeConfig._handlerFunction).to.equal(handler1);
    });

    it('should accept wrapped handler', () => {
      subject.use(null, appConfigWrappers.handler(handler1));

      const matchingConfig = subject.find('testHandler', 'route');
      expect(matchingConfig.length).to.equal(1);
      expect(matchingConfig[0].source).to.equal('any');
      expect(matchingConfig[0].path).to.equal('any');
      expect(matchingConfig[0].method).to.equal('any');
      expect(matchingConfig[0].routeConfig._type).to.equal('reqres');
      expect(matchingConfig[0].routeConfig._handlerFunction).to.equal(handler1);
    });

    it('should accept raw handler', () => {
      subject.use(null, appConfigWrappers.rawHandler(handler1));

      const matchingConfig = subject.find('testHandler', 'route');
      expect(matchingConfig.length).to.equal(1);
      expect(matchingConfig[0].source).to.equal('any');
      expect(matchingConfig[0].path).to.equal('any');
      expect(matchingConfig[0].method).to.equal('any');
      expect(matchingConfig[0].routeConfig._type).to.equal('raw');
      expect(matchingConfig[0].routeConfig._handlerFunction).to.equal(handler1);
    });

    it('should accept authorizer handler', () => {
      subject.use(null, appConfigWrappers.authorizerHandler(handler1));

      const matchingConfig = subject.find('testHandler', 'route');
      expect(matchingConfig.length).to.equal(1);
      expect(matchingConfig[0].source).to.equal('any');
      expect(matchingConfig[0].path).to.equal('any');
      expect(matchingConfig[0].method).to.equal('any');
      expect(matchingConfig[0].routeConfig._type).to.equal('auth');
      expect(matchingConfig[0].routeConfig._handlerFunction).to.equal(handler1);
    });

    it('authorizer handler should have no middleware', () => {
      const reqMiddleware = routeConfigWrappers.request(() => {});
      const resMiddleware = routeConfigWrappers.response(() => {});
      const finMiddleware = routeConfigWrappers.final(() => {});
      subject.middleware(null, reqMiddleware, resMiddleware, finMiddleware);
      subject.use(null, appConfigWrappers.authorizerHandler(handler1));

      const matchingConfig = subject.find('testHandler', 'middleware');
      expect(matchingConfig.length).to.equal(0);
    });

    it('should accept cron handler', () => {
      subject.use(null, appConfigWrappers.cronHandler(handler1));

      const matchingConfig = subject.find('testHandler', 'route');
      expect(matchingConfig.length).to.equal(1);
      expect(matchingConfig[0].source).to.equal('any');
      expect(matchingConfig[0].path).to.equal('any');
      expect(matchingConfig[0].method).to.equal('any');
      expect(matchingConfig[0].routeConfig._type).to.equal('cron');
      expect(matchingConfig[0].routeConfig._handlerFunction).to.equal(handler1);
    });

    it('cron handler should have no middleware', () => {
      const reqMiddleware = routeConfigWrappers.request(() => {});
      const resMiddleware = routeConfigWrappers.response(() => {});
      const finMiddleware = routeConfigWrappers.final(() => {});
      subject.middleware(null, reqMiddleware, resMiddleware, finMiddleware);
      subject.use(null, appConfigWrappers.cronHandler(handler1));

      const matchingConfig = subject.find('testHandler', 'middleware');
      expect(matchingConfig.length).to.equal(0);
    });

    it('should NOT support the override directive', () => {
      expect(() => subject.use('testHandler', routeConfigWrappers.override(handler1))).to.throw();
    });

    it('should NOT accept a non function', () => {
      expect(() => subject.use('testHandler', {})).to.throw();
    });

    it('should NOT accept no handler argument', () => {
      expect(() => subject.use('testHandler')).to.throw();
    });

    it('should NOT accept more than one handler argument', () => {
      expect(() => subject.use('testHandler', 'src', handler1, handler2)).to.throw();
    });
  });

  describe('httpRoute', () => {
    const handler1 = () => {};
    const handler2 = () => {};

    it('should append to existing config', () => {
      subject.httpRoute(null, 'POST', '/test', handler1);
      subject.httpRoute('testHandler', 'GET', '/test2', handler2);

      const matchingConfig = subject.find('testHandler', 'route');
      expect(matchingConfig.length).to.equal(2);
      expect(matchingConfig[0].source).to.equal('http');
      expect(matchingConfig[0].path).to.equal('/test');
      expect(matchingConfig[0].method).to.equal('POST');
      expect(matchingConfig[0].routeConfig._type).to.equal('reqres');
      expect(matchingConfig[0].routeConfig._handlerFunction).to.equal(handler1);
      expect(matchingConfig[1].source).to.equal('http');
      expect(matchingConfig[1].path).to.equal('/test2');
      expect(matchingConfig[1].method).to.equal('GET');
      expect(matchingConfig[1].routeConfig._type).to.equal('reqres');
      expect(matchingConfig[1].routeConfig._handlerFunction).to.equal(handler2);
    });

    it('should accept wrapped handler', () => {
      subject.httpRoute(null, 'POST', '/test', appConfigWrappers.handler(handler1));

      const matchingConfig = subject.find('testHandler', 'route');
      expect(matchingConfig.length).to.equal(1);
      expect(matchingConfig[0].source).to.equal('http');
      expect(matchingConfig[0].path).to.equal('/test');
      expect(matchingConfig[0].method).to.equal('POST');
      expect(matchingConfig[0].routeConfig._type).to.equal('reqres');
      expect(matchingConfig[0].routeConfig._handlerFunction).to.equal(handler1);
    });

    it('should accept raw handler', () => {
      subject.httpRoute(null, 'POST', '/test', appConfigWrappers.rawHandler(handler1));

      const matchingConfig = subject.find('testHandler', 'route');
      expect(matchingConfig.length).to.equal(1);
      expect(matchingConfig[0].source).to.equal('http');
      expect(matchingConfig[0].path).to.equal('/test');
      expect(matchingConfig[0].method).to.equal('POST');
      expect(matchingConfig[0].routeConfig._type).to.equal('raw');
      expect(matchingConfig[0].routeConfig._handlerFunction).to.equal(handler1);
    });

    it('should NOT accept authorizer handler', () => {
      expect(() => subject.httpRoute(null, 'POST', '/test', appConfigWrappers.authorizerHandler(handler1))).to.throw();
    });

    it('should NOT accept cron handler', () => {
      expect(() => subject.httpRoute(null, 'POST', '/test', appConfigWrappers.cronHandler(handler1))).to.throw();
    });

    it('should NOT support the override directive', () => {
      expect(() => subject.httpRoute(null, 'POST', '/test', routeConfigWrappers.override(handler1))).to.throw();
    });

    it('should NOT accept a non function', () => {
      expect(() => subject.httpRoute(null, 'POST', '/test', {})).to.throw();
    });

    it('should NOT accept no handler argument', () => {
      expect(() => subject.httpRoute(null, 'POST', '/test')).to.throw();
    });

    it('should NOT accept no path argument', () => {
      expect(() => subject.httpRoute(null, 'POST')).to.throw();
    });

    it('should NOT accept non string path argument', () => {
      expect(() => subject.httpRoute(null, 'POST', {})).to.throw();
    });

    it('should NOT accept no method argument', () => {
      expect(() => subject.httpRoute(null)).to.throw();
    });

    it('should NOT accept non string method argument', () => {
      expect(() => subject.httpRoute(null, {}, '/test')).to.throw();
    });

    it('should NOT accept more than one handler argument', () => {
      expect(() => subject.httpRoute(null, 'POST', '/test', handler1, handler2)).to.throw();
    });
  });
});