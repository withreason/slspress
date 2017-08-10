'use strict';

const sinon = require('sinon');
const chai = require('chai');
chai.use(require('sinon-chai'));
const expect = chai.expect;

const ApplicationError = require('../../lib/error/application-error');
const BadRequestError = require('../../lib/error/bad-request-error');
const NotFoundError = require('../../lib/error/not-found-error');
const UnprocessableEntityError = require('../../lib/error/unprocessable-entity-error');
const subject = require('../../lib/simple-error-handler');

describe('SimpleErrorHandler', () => {

  let fakeRequest, stubResponse, thisContext;

  beforeEach(() => {
    thisContext = { logger: { error: sinon.spy() } };
    fakeRequest = {};
    stubResponse = {
      badRequest: sinon.spy(),
      notFound: sinon.spy(),
      unprocessableEntity: sinon.spy(),
      internalServerError: sinon.spy()
    };
  });

  describe('should log', () => {
    it('just message if error is a known type', () => {
      stubResponse.error = new ApplicationError('Bang!');

      subject.call(thisContext, fakeRequest, stubResponse);

      expect(thisContext.logger.error).to.have.been.calledWithExactly('[ERROR]', 'Bang!');
    });

    it('full error if unexpected error', () => {
      stubResponse.error = new Error('Bang!');

      subject.call(thisContext, fakeRequest, stubResponse);

      expect(thisContext.logger.error).to.have.been.calledOnce;
      expect(thisContext.logger.error.getCall(0).args[0]).to.equal('[ERROR] Unexpected error');
      expect(thisContext.logger.error.getCall(0).args[1].error).to.equal(stubResponse.error);
      expect(thisContext.logger.error.getCall(0).args[1].message).to.equal('Bang!');
      expect(thisContext.logger.error.getCall(0).args[1].stack).not.to.be.undefined;
    });

    it('object if unexpected error type', () => {
      stubResponse.error = 'string error';

      subject.call(thisContext, fakeRequest, stubResponse);

      expect(thisContext.logger.error).to.have.been.calledWithExactly('[ERROR] Unknown error object', stubResponse.error);
    });
  });

  describe('should respond with', () => {
    it('500 for unknown application error type', () => {
      stubResponse.error = new ApplicationError('Bang!');

      subject.call(thisContext, fakeRequest, stubResponse);

      expect(stubResponse.internalServerError).to.have.been.calledOnce;
    });

    it('500 for unexpected error', () => {
      stubResponse.error = new Error('Bang!');

      subject.call(thisContext, fakeRequest, stubResponse);

      expect(stubResponse.internalServerError).to.have.been.calledOnce;
    });

    it('500 for unexpected error type', () => {
      stubResponse.error = 'string error';

      subject.call(thisContext, fakeRequest, stubResponse);

      expect(stubResponse.internalServerError).to.have.been.calledOnce;
    });

    it('400 for bad request error type', () => {
      stubResponse.error = new BadRequestError();

      subject.call(thisContext, fakeRequest, stubResponse);

      expect(stubResponse.badRequest).to.have.been.calledOnce;
    });

    it('404 for not found error type', () => {
      stubResponse.error = new NotFoundError();

      subject.call(thisContext, fakeRequest, stubResponse);

      expect(stubResponse.notFound).to.have.been.calledOnce;
    });

    it('422 for unprocessable entity error type', () => {
      stubResponse.error = new UnprocessableEntityError();

      subject.call(thisContext, fakeRequest, stubResponse);

      expect(stubResponse.unprocessableEntity).to.have.been.calledOnce;
    });
  });

});