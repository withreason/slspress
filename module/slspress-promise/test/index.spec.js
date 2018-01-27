
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
chai.use(require('sinon-chai'));

const { promise, promiseMiddleware } = require('..');

describe('promise', () => {

  const req = { a: 'req' };
  const res = {
    send: null,
    handleError: null
  };
  let next = null;

  beforeEach(() => {
    next = sinon.spy();
    res.send = sinon.spy();
    res.handleError = sinon.spy();
  });

  describe('handler', () => {
    it('should send response with data from successful promise', () => {
      return promise(() => Promise.resolve({ some: 'data'}))._handlerFunction(req, res)
        .then(() => expect(res.send).to.have.been.calledWithExactly({ some: 'data'}));
    });

    it('should handle error if promise rejects', () => {
      const err = new Error('bang');
      return promise(() => Promise.reject(err))._handlerFunction(req, res)
        .then(() => {
          expect(res.send).not.to.have.been.called;
          expect(res.handleError).to.have.been.calledWithExactly(err);
        });
    });
  });

  describe('middleware', () => {
    it('should call next from successful promise', () => {
      return promiseMiddleware(() => Promise.resolve())(req, res, next)
        .then(() => expect(next).to.have.been.called);
    });

    it('should handle error if promise rejects', () => {
      const err = new Error('bang');
      return promiseMiddleware(() => Promise.reject(err))(req, res, next)
        .then(() => {
          expect(next).not.to.have.been.called;
          expect(res.handleError).to.have.been.calledWithExactly(err);
        });
    });
  });


});