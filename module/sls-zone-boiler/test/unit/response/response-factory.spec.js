'use strict';

const sinon = require("sinon");
const chai = require('chai');
chai.use(require("sinon-chai"));
const expect = chai.expect;

const ResponseFactory = require('../../../lib/response/response-factory');

describe('ResponseFactory', function() {
  describe('creates response', function () {

    const defaultHeaders = {
      'Content-Type': 'application/json'
    };

    const body = { mock: 'body'};
    let responseFactory;

    beforeEach(() => {
      responseFactory = new ResponseFactory();
    });


    function assertResponse(response, expectedCallbackObject) {
      const cb = sinon.spy();
      response.send(cb);
      expect(cb).to.have.been.calledWith(null, expectedCallbackObject);
    }

    it('ok', function () {
      const res = responseFactory.ok(body);

      assertResponse(res, {
        statusCode: 200,
        headers: defaultHeaders,
        body: body
      });
    });

    it('ok with no body', function () {
      const res = responseFactory.ok();

      assertResponse(res, {
        statusCode: 200,
        headers: defaultHeaders,
        body: undefined
      });
    });

    it('created', function () {
      const res = responseFactory.created(body);

      assertResponse(res, {
        statusCode: 201,
        headers: defaultHeaders,
        body: body
      });
    });

    it('created with no body', function () {
      const res = responseFactory.created();

      assertResponse(res, {
        statusCode: 201,
        headers: defaultHeaders,
        body: undefined
      });
    });

    it('no content', function () {
      const res = responseFactory.noContent();

      assertResponse(res, {
        statusCode: 204,
        headers: defaultHeaders,
        body: undefined
      });
    });

    it('bad request', function () {
      const res = responseFactory.badRequest(body);

      assertResponse(res, {
        statusCode: 400,
        headers: defaultHeaders,
        body: body
      });
    });

    it('bad request with no body', function () {
      const res = responseFactory.badRequest();

      assertResponse(res, {
        statusCode: 400,
        headers: defaultHeaders,
        body: undefined
      });
    });

    it('unauthorised', function () {
      const res = responseFactory.unauthorised(body);

      assertResponse(res, {
        statusCode: 401,
        headers: defaultHeaders,
        body: body
      });
    });

    it('unauthorised with no body', function () {
      const res = responseFactory.unauthorised();

      assertResponse(res, {
        statusCode: 401,
        headers: defaultHeaders,
        body: undefined
      });
    });

    it('forbidden', function () {
      const res = responseFactory.forbidden(body);

      assertResponse(res, {
        statusCode: 403,
        headers: defaultHeaders,
        body: body
      });
    });

    it('forbidden with no body', function () {
      const res = responseFactory.forbidden();

      assertResponse(res, {
        statusCode: 403,
        headers: defaultHeaders,
        body: undefined
      });
    });

    it('not found', function () {
      const res = responseFactory.notFound(body);

      assertResponse(res, {
        statusCode: 404,
        headers: defaultHeaders,
        body: body
      });
    });

    it('not found with no body', function () {
      const res = responseFactory.notFound();

      assertResponse(res, {
        statusCode: 404,
        headers: defaultHeaders,
        body: undefined
      });
    });

    it('unprocessable entity', function () {
      const res = responseFactory.unprocessableEntity(body);

      assertResponse(res, {
        statusCode: 422,
        headers: defaultHeaders,
        body: body
      });
    });

    it('unprocessable entity with no body', function () {
      const res = responseFactory.unprocessableEntity();

      assertResponse(res, {
        statusCode: 422,
        headers: defaultHeaders,
        body: undefined
      });
    });

    it('internal server error', function () {
      const res = responseFactory.internalServerError(body);

      assertResponse(res, {
        statusCode: 500,
        headers: defaultHeaders,
        body: body
      });
    });

    it('internal server error with no body', function () {
      const res = responseFactory.internalServerError();

      assertResponse(res, {
        statusCode: 500,
        headers: defaultHeaders,
        body: undefined
      });
    });

    it('custom headers', function () {
      const customHeaders = { mock: 'headers' };
      responseFactory = responseFactory.withHeaders(customHeaders);
      const res = responseFactory.ok();

      assertResponse(res, {
        statusCode: 200,
        headers: customHeaders,
        body: undefined
      });
    });
  });
});