const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
chai.use(require('sinon-chai'));

const { NotFoundError: SlspressNotFoundError } = require('slspress');

const createNotFoundMapping = require('../lib/bookshelf-not-found-mapping').create;
const suppressNotFound = require('../lib/bookshelf-not-found-mapping').suppress;

class BookshelfNotFoundError extends Error {}
class BookshelfNoRowsDeletedError extends Error {}
class BookshelfNoRowsUpdatedError extends Error {}

class MockModel {
  get NotFoundError() {
    return BookshelfNotFoundError;
  }
  get NoRowsDeletedError() {
    return BookshelfNoRowsDeletedError;
  }
  get NoRowsUpdatedError() {
    return BookshelfNoRowsUpdatedError;
  }
  get prototype() {
    return { tableName: 'users' }
  }
}

describe('Bookshelf not found mapping', () => {

  let mockModel = null;

  beforeEach(() => {
    mockModel = new MockModel();
  });

  describe('create', () => {
    it('should convert a bookshelf not found error to an slspress one', () => {
      const errorHandler = createNotFoundMapping(mockModel, 'an-id');

      expect(() => errorHandler(new mockModel.NotFoundError())).to
        .throw(SlspressNotFoundError, 'Could not find users object with id an-id');
    });

    it('should convert a bookshelf not found error to an slspress one', () => {
      const errorHandler = createNotFoundMapping(mockModel, 'an-id');

      expect(() => errorHandler(new mockModel.NoRowsUpdatedError())).to
        .throw(SlspressNotFoundError, 'Could not find users object with id an-id');
    });

    it('should convert a bookshelf not found error to an slspress one', () => {
      const errorHandler = createNotFoundMapping(mockModel, 'an-id');

      expect(() => errorHandler(new mockModel.NoRowsDeletedError())).to
        .throw(SlspressNotFoundError, 'Could not find users object with id an-id');
    });

    it('should convert a bookshelf modelbase plus not found error to an slspress one', () => {
      const errorHandler = createNotFoundMapping(mockModel, 'an-id');

      expect(() => errorHandler('NOT_FOUND')).to
        .throw(SlspressNotFoundError, 'Could not find users object with id an-id');
    });

    it('should not convert a different error', () => {
      const errorHandler = createNotFoundMapping(mockModel);

      expect(() => errorHandler(new Error('different error'))).to.throw(Error, 'different error');
    });
  });

  describe('surpress', () => {
    it('should convert a bookshelf not found error to the given object', () => {
      const obj = { an: 'object'};
      const errorHandler = suppressNotFound(mockModel, obj);

      expect(errorHandler(new mockModel.NotFoundError())).to.eql(obj);
    });

    it('should convert a bookshelf modelbase plus not found error to the given object', () => {
      const obj = { an: 'object'};
      const errorHandler = suppressNotFound(mockModel, obj);

      expect(errorHandler('NOT_FOUND')).to.eql(obj);
    });

    it('should convert a bookshelf nothing updated error to the given object', () => {
      const obj = { an: 'object'};
      const errorHandler = suppressNotFound(mockModel, obj);

      expect(errorHandler(new mockModel.NoRowsUpdatedError())).to.eql(obj);
    });

    it('should convert a bookshelf nothing updated error to the given object', () => {
      const obj = { an: 'object'};
      const errorHandler = suppressNotFound(mockModel, obj);

      expect(errorHandler(new mockModel.NoRowsDeletedError())).to.eql(obj);
    });

    it('should not convert a different error', () => {
      const errorHandler = suppressNotFound(mockModel, null);

      expect(() => errorHandler(new Error('different error'))).to.throw(Error, 'different error');
    });
  });


});