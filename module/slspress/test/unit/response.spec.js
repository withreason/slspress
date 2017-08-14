'use strict';

const sinon = require('sinon');
const chai = require('chai');
chai.use(require('sinon-chai'));
const expect = chai.expect;

const Response = require('../../lib/response');

describe('Response', () => {

  let fakeRequest;

  let mockCallback;
  let mockErrorHandler;

  let subject;

  beforeEach(() => {
    fakeRequest = { event: { httpMethod: 'GET' }, context: {}, app: {} };

    mockCallback = sinon.spy();
    mockErrorHandler = sinon.spy();

    subject = new Response(fakeRequest, mockCallback, mockErrorHandler, {});
  });

  function callbackInvokedWith(mockCallback, statusCode, body, headers) {
    expect(mockCallback).to.have.been.calledOnce;
    expect(mockCallback.firstCall.args[0]).to.be.null;
    expect(mockCallback.firstCall.args[1].body).to.eql(body);
    expect(mockCallback.firstCall.args[1].statusCode).to.eql(statusCode);
    expect(mockCallback.firstCall.args[1].headers).to.eql(headers);
  }

  describe('send', () => {
    it('should invoke the callback', () => {
      const body = { a: 'body' };
      subject.send(200, body);

      callbackInvokedWith(mockCallback, 200, body, {});
    });

    it('should not invoke the callback more than once', () => {
      const body = { a: 'body' };
      subject.send(200, body);
      expect(() => subject.send(200, body)).to.throw();
      expect(mockCallback).to.have.been.calledOnce;
    });

    describe('when response status is not provided', () => {
      it('when there is no body status should be no content', () => {
        subject.send();

        callbackInvokedWith(mockCallback, 204, undefined, {});
      });

      it('when there is a null body status should be no content', () => {
        subject.send(null);

        callbackInvokedWith(mockCallback, 204, null, {});
      });

      it('when there is a body and the event is a post the status should be created', () => {
        fakeRequest.event.httpMethod = 'POST';
        const body = { a: 'body' };
        subject.send(body);

        callbackInvokedWith(mockCallback, 201, body, {});
      });

      it('when there is a body and the event is NOT a post the status should be ok', () => {
        fakeRequest.event.httpMethod = 'GET';
        const body = { a: 'body' };
        subject.send(body);

        callbackInvokedWith(mockCallback, 200, body, {});
      });
    });
  });

  it('initial headers should be added to the response', () => {
    subject = new Response(fakeRequest, mockCallback, mockErrorHandler, { some: 'headers'});
    subject.send();

    callbackInvokedWith(mockCallback, 204, undefined,  { some: 'headers'});
  });

  it('addHeaders should add headers to the response', () => {
    subject = new Response(fakeRequest, mockCallback, mockErrorHandler, { some: 'headers'});
    const headers = { more: 'headers'};
    subject.addHeaders(headers).send();

    callbackInvokedWith(mockCallback, 204, undefined, { some: 'headers', more: 'headers'});
  });

  it('addHeaders should overwrite initial headers', () => {
    subject = new Response(fakeRequest, mockCallback, mockErrorHandler, { some: 'headers'});
    const headers = { some: 'otherHeader'};
    subject.addHeaders(headers).send();

    callbackInvokedWith(mockCallback, 204, undefined, { some: 'otherHeader' });
  });

  it('handleError should delegate to the given error handler function', () => {
    const error = new Error('test');
    subject.handleError(error);

    expect(mockErrorHandler).to.have.been.calledWithExactly(error, fakeRequest, subject);
  });

  describe('update', () => {
    it('should not be callable before send has been called', () => {
      expect(() => subject.update({})).to.throw();
    });

    it('should be able to update the body after send has been called', () => {
      subject.send(200, { body: 'handler'});
      const responseSentToMiddlewareChain = mockCallback.firstCall.args[1];
      responseSentToMiddlewareChain.update({ body: 'updated'});
      expect(responseSentToMiddlewareChain.body).to.eql( { body: 'updated'})
    });

    it('should be able to update the status code after send has been called', () => {
      subject.send(200, { body: 'handler'});
      const responseSentToMiddlewareChain = mockCallback.firstCall.args[1];
      responseSentToMiddlewareChain.update(201, { body: 'updated'});
      expect(responseSentToMiddlewareChain.body).to.eql( { body: 'updated'});
      expect(responseSentToMiddlewareChain.statusCode).to.eql(201);
    });

    it('should be able to update the headers after send has been called', () => {
      subject.send(200, { body: 'handler'});
      const responseSentToMiddlewareChain = mockCallback.firstCall.args[1];
      responseSentToMiddlewareChain.addHeaders({ some: 'otherHeader' });
      expect(responseSentToMiddlewareChain.headers).to.eql({ some: 'otherHeader' });
    });

    it('should be able to clear out body and leave status the same after send has been called', () => {
      subject.send(200, { body: 'handler'});
      const responseSentToMiddlewareChain = mockCallback.firstCall.args[1];
      responseSentToMiddlewareChain.update();
      expect(responseSentToMiddlewareChain.body).to.be.undefined;
      expect(responseSentToMiddlewareChain.statusCode).to.eql(200);
    });
  });

  describe('internal function', () => {
    it('_toPlain should return a plain response object', () => {
      subject.addHeaders({ some: 'header'}).send(200, { body: 'test'});

      const plain = subject._toPlain();
      expect(plain).to.eql({
        body: { body: 'test'},
        headers: { some: 'header'},
        statusCode: 200
      });
    });

    it('_createErrorResponse should clone response but with new callback and error object', () => {
      subject.addHeaders({ some: 'header'}).send(200, { body: 'test'});

      const err = new Error('Bang!');
      const newMockCallback = sinon.spy();
      const result = subject._createErrorResponse(err, newMockCallback);

      expect(result.headers).to.eql({ some: 'header'});
      expect(result.body).to.eql({ body: 'test'});
      expect(result.statusCode).to.equal(200);
      expect(result.error).to.eql(err);

      expect(newMockCallback).not.to.have.been.called;

      result.notFound();
      callbackInvokedWith(newMockCallback, 404, undefined, { some: 'header'});
    });

    it('_updateFromRawHandlerResponse should clone this response updating the status code, body, headers and error', () => {
      const err = new Error('Bang!');

      const result = subject._createFromRawHandlerResponse(err, {
        body: { some: 'body' },
        headers: { some: 'header' },
        statusCode: 200
      });

      expect(result.headers).to.eql({ some: 'header'});
      expect(result.body).to.eql({ some: 'body'});
      expect(result.statusCode).to.equal(200);
      expect(result.error).to.eql(err);
    });

    it('_updateFromRawHandlerResponse should clone this response NOT updating the status code, body, headers and error if they are missing', () => {
      subject.addHeaders({ some: 'header'}).send(200, { some: 'body' });

      const result = subject._createFromRawHandlerResponse(null, {});

      expect(result.headers).to.eql({ some: 'header'});
      expect(result.body).to.eql({ some: 'body'});
      expect(result.statusCode).to.equal(200);
      expect(result.error).to.be.null;
    });
  });

  describe('shortcut', () => {
    it('ok should send 200', () => {
      const body = { a: 'body' };
      subject.ok(body);

      callbackInvokedWith(mockCallback, 200, body, {});
    });

    it('created should send 201', () => {
      const body = { a: 'body' };
      subject.created(body);

      callbackInvokedWith(mockCallback, 201, body, {});
    });

    it('no content should send 204', () => {
      subject.noContent();

      callbackInvokedWith(mockCallback, 204, undefined, {});
    });

    it('bad request should send 400', () => {
      const body = { a: 'body' };
      subject.badRequest(body);

      callbackInvokedWith(mockCallback, 400, body, {});
    });

    it('unauthorised should send 401', () => {
      const body = { a: 'body' };
      subject.unauthorised(body);

      callbackInvokedWith(mockCallback, 401, body, {});
    });

    it('forbidden should send 403', () => {
      const body = { a: 'body' };
      subject.forbidden(body);

      callbackInvokedWith(mockCallback, 403, body, {});
    });

    it('not found should send 404', () => {
      const body = { a: 'body' };
      subject.notFound(body);

      callbackInvokedWith(mockCallback, 404, body, {});
    });

    it('unprocessable entity should send 422', () => {
      const body = { a: 'body' };
      subject.unprocessableEntity(body);

      callbackInvokedWith(mockCallback, 422, body, {});
    });

    it('internal server error should send 500', () => {
      const body = { a: 'body' };
      subject.internalServerError(body);

      callbackInvokedWith(mockCallback, 500, body, {});
    });


  });

});