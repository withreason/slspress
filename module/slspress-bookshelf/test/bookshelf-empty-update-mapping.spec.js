const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
chai.use(require('sinon-chai'));

const { UnprocessableEntityError } = require('slspress');

const createEmptyUpdate  = require('../lib/bookshelf-empty-update-mapping').create;
const suppressEmptyUpdate = require('../lib/bookshelf-empty-update-mapping').suppress;


describe('Bookshelf empty update', () => {

  describe('create', () => {
    it('should convert a bookshelf empty update error to an slspress one', () => {
      const errorHandler = createEmptyUpdate();

      expect(() => errorHandler('EMPTY_REQUEST')).to
        .throw(UnprocessableEntityError, 'An update was requested but there were no updateable fields present');
    });

    it('should not convert a different error', () => {
      const errorHandler = createEmptyUpdate();

      expect(() => errorHandler(new Error('different error'))).to.throw(Error, 'different error');
    });
  });

  describe('surpress', () => {
    it('should convert a bookshelf not found error to the given object', () => {
      const obj = { an: 'object'};
      const errorHandler = suppressEmptyUpdate(obj);

      expect(errorHandler('EMPTY_REQUEST')).to.eql(obj);
    });

    it('should not convert a different error', () => {
      const errorHandler = suppressEmptyUpdate(null);

      expect(() => errorHandler(new Error('different error'))).to.throw(Error, 'different error');
    });
  });


});