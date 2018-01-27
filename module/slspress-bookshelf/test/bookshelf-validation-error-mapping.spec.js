const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
chai.use(require('sinon-chai'));

const { UnprocessableEntityError } = require('slspress');

const createValidationMapping = require('../lib/bookshelf-validation-mapping').create;
const suppressValidationMapping = require('../lib/bookshelf-validation-mapping').suppress;


describe('Bookshelf validation mapping', () => {

  const createError = (validationMessages) => {
    const error = new Error();
    error.name = 'ValidationError';
    error.details = validationMessages.map(message => ({ message }));
    error.isJoi = true;
    return error;
  };

  describe('create', () => {
    it('should convert a bookshelf not found error to an slspress one', () => {
      const errorHandler = createValidationMapping();

      expect(() => errorHandler(createError(['"email" must be a valid email', '"name" must longer than 0'])))
        .to.throw(UnprocessableEntityError, 'The entity failed validation for the following reasons:\n"email" must be a valid email\n"name" must longer than 0');
    });

    it('should not convert a different error', () => {
      const errorHandler = createValidationMapping();

      expect(() => errorHandler(new Error('different error'))).to.throw(Error, 'different error');
    });
  });

  describe('surpress', () => {
    it('should convert a bookshelf not found error to the given object', () => {
      const obj = { an: 'object'};
      const errorHandler = suppressValidationMapping(obj);

      expect(errorHandler(createError(['"email" must be a valid email']))).to.eql(obj);
    });

    it('should not convert a different error', () => {
      const errorHandler = suppressValidationMapping(null);

      expect(() => errorHandler(new Error('different error'))).to.throw(Error, 'different error');
    });
  });


});