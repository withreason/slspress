'use strict';

const sinon = require('sinon');
const chai = require('chai');
chai.use(require('sinon-chai'));
const expect = chai.expect;

const PromiseHandlerWrapper = require('../../lib/promise-handler-wrapper');
const ErrorHandler = require('../../lib/error/error-handler');
const ResponseFactory = require('../../lib/response/response-factory');

describe('PromiseHandlerWrapper', function() {

  const fakeEvent = { fake: 'event', httpMethod: 'GET' };
  const fakeContext = { fake: 'context' };
  let mockCallback = null;
  let mockErrorHandler = null;
  let mockHandler = null;
  let wrapper = null;

  function expectHandlerToHaveBeenCalledAndRespond(handlerResponse) {
    expectHandlerToHaveBeenCalled();
    mockHandler.firstCall.args[2](handlerResponse);
  }

  function expectHandlerToHaveBeenCalled() {
    expect(mockHandler).to.have.been.calledWith(fakeEvent, fakeContext);
    expect(mockHandler.firstCall.args.length).to.equal(3);
    expect(typeof mockHandler.firstCall.args[2]).to.equal('function');
  }

  beforeEach(() => {
    mockCallback = sinon.spy();
    mockErrorHandler = new ErrorHandler();
    mockErrorHandler.handle = sinon.spy();
    mockHandler = sinon.spy();
    wrapper = new PromiseHandlerWrapper(new ResponseFactory());
  });

  it('should call the handler', done => {
    const wrappedHandler = wrapper.wrapToHandlePromiseResult(mockHandler);
    wrappedHandler(fakeEvent, fakeContext, mockCallback);

    setTimeout(() => {
      expectHandlerToHaveBeenCalledAndRespond();
      setTimeout(() => {
        expect(mockCallback).to.have.been.called;
        done();
      });
    });
  });

  describe('returning a promise', () => {
    it('should callback when the promise completes', done => {
      let resolvePromise = null;
      const handler = () => new Promise((resolve, reject) => resolvePromise = resolve);
      const wrappedHandler = wrapper.wrapToHandlePromiseResult(handler);

      wrappedHandler(fakeEvent, fakeContext, mockCallback);

      setTimeout(() => {
        expect(mockCallback).not.to.have.been.called;
        resolvePromise();
        setTimeout(() => {
          expect(mockCallback).to.have.been.called;
          done();
        });
      });
    });

    it('should callback with a 204 if the promise content is empty', done => {
      const handler = () => Promise.resolve();
      const wrappedHandler = wrapper.wrapToHandlePromiseResult(handler);

      wrappedHandler(fakeEvent, fakeContext, mockCallback);

      setTimeout(() => {
        expect(mockCallback).to.have.been.calledWith(null, {
          body: undefined,
          statusCode: 204,
          headers: {
            'Content-Type': 'application/vnd.api+json'
          }
        });
        done();
      });
    });

    it('should callback with a 200 if the promise has content', done => {
      const fakeBody = { fake: 'body' };
      const handler = () => Promise.resolve(fakeBody);
      const wrappedHandler = wrapper.wrapToHandlePromiseResult(handler);

      wrappedHandler(fakeEvent, fakeContext, mockCallback);

      setTimeout(() => {
        expect(mockCallback).to.have.been.calledWith(null, {
          body: fakeBody,
          statusCode: 200,
          headers: {
            'Content-Type': 'application/vnd.api+json'
          }
        });
        done();
      });
    });

    it('should callback with a 201 if the promise has content and the event is a POST', done => {
      fakeEvent.httpMethod = 'POST';
      const fakeBody = { fake: 'body' };
      const handler = () => Promise.resolve(fakeBody);
      const wrappedHandler = wrapper.wrapToHandlePromiseResult(handler);

      wrappedHandler(fakeEvent, fakeContext, mockCallback);

      setTimeout(() => {
        expect(mockCallback).to.have.been.calledWith(null, {
          body: fakeBody,
          statusCode: 201,
          headers: {
            'Content-Type': 'application/vnd.api+json'
          }
        });
        done();
      });
    });

    it('should callback with the response returned by the promise', done => {
      const fakeBody = { fake: 'body' };
      const handler = () => Promise.resolve(new ResponseFactory().notFound(fakeBody));
      const wrappedHandler = wrapper.wrapToHandlePromiseResult(handler);

      wrappedHandler(fakeEvent, fakeContext, mockCallback);

      setTimeout(() => {
        expect(mockCallback).to.have.been.calledWith(null, {
          body: fakeBody,
          statusCode: 404,
          headers: {
            'Content-Type': 'application/vnd.api+json'
          }
        });
        done();
      });
    });
  });
});