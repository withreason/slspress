const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
chai.use(require('sinon-chai'));

const BookshelfModel = require('../lib/bookshelf-model');

describe('Bookshelf Model', () => {

  let mockContainer = null;
  let mockBookshelfComponent = null;

  const basicModel = {
    table: 'test'
  };

  beforeEach(() => {
    mockBookshelfComponent = { createModel: sinon.spy() };
    mockContainer = { fetch: sinon.stub().returns(mockBookshelfComponent) };
  });

  describe('should look up Bookshelf component', () => {

    it('by default name', () => {
      new BookshelfModel(mockContainer, basicModel).start();
      expect(mockContainer.fetch).to.have.been.calledWithExactly('resources/bookshelf');
    });

    it('by custom name', () => {
      const customName = 'custom';
      new BookshelfModel(mockContainer, basicModel, customName).start();
      expect(mockContainer.fetch).to.have.been.calledWithExactly(customName);
    });
  });

  it('should call create model on bookshelf with given params for simple model', () => {
    new BookshelfModel(mockContainer, basicModel).start();
    expect(mockBookshelfComponent.createModel).to.have.been.calledWithExactly(basicModel);
  });

  describe('relationship', () => {

    let targetComponent = null;

    beforeEach(() => {
      targetComponent = sinon.spy();
      mockContainer.fetch.withArgs('target-component-name').returns(targetComponent);
    });

    function getArgsFromFirstAndOnlyCall(spy) {
      expect(spy).to.have.been.calledOnce;
      return spy.getCall(0).args;
    }

    function validateCreateModelWithRelationship(normalProperties, relationshipPropName,
                                                 relationshipType, relationshipTargetComponent,
                                                 additionalArgs) {
      additionalArgs = additionalArgs || [];

      const onlyCallArgs = getArgsFromFirstAndOnlyCall(mockBookshelfComponent.createModel);
      expect(onlyCallArgs.length).to.equal(1);
      const callArg = onlyCallArgs[0];

      Object.keys(normalProperties).forEach(key => {
        const expectedVal = normalProperties[key];
        expect(callArg[key]).to.equal(expectedVal);
      });
      expect(typeof callArg[relationshipPropName]).to.equal('function');

      const thisContext = {};
      thisContext[relationshipType] = sinon.spy(() => 'a-result');

      const result = callArg[relationshipPropName].call(thisContext);
      expect(result).to.equal('a-result');

      const args = getArgsFromFirstAndOnlyCall(thisContext[relationshipType]);
      expect(args.length).to.equal(additionalArgs.length + 1);
      let i = 0;
      expect(args[i++]).to.eql(relationshipTargetComponent);
      additionalArgs.forEach(expectedArg => {
        expect(args[i++]).to.eql(expectedArg);
      });
    }

    it('hasMany should be converted to bookshelf hasMany', () => {
      const model = {
        table: 'test',
        testProp: {
          relationshipType: 'hasMany',
          target: 'target-component-name'
        }
      };

      new BookshelfModel(mockContainer, model).start();

      validateCreateModelWithRelationship({ table: 'test' }, 'testProp', 'hasMany', targetComponent);
    });

    it('additional information should be passed', () => {
      const model = {
        table: 'test',
        testProp: {
          relationshipType: 'hasMany',
          target: 'target-component-name',
          additionalInfo: ['fkey', 'fKeyTarget']
        }
      };

      new BookshelfModel(mockContainer, model).start();

      validateCreateModelWithRelationship({ table: 'test' }, 'testProp', 'hasMany', targetComponent, ['fkey', 'fKeyTarget']);
    });

    it('hasOne should be converted to bookshelf hasOne', () => {
      const model = {
        table: 'test',
        testProp: {
          relationshipType: 'hasOne',
          target: 'target-component-name'
        }
      };

      new BookshelfModel(mockContainer, model).start();

      validateCreateModelWithRelationship({ table: 'test' }, 'testProp', 'hasOne', targetComponent);
    });

    it('belongsTo should be converted to bookshelf belongsTo', () => {
      const model = {
        table: 'test',
        testProp: {
          relationshipType: 'belongsTo',
          target: 'target-component-name'
        }
      };

      new BookshelfModel(mockContainer, model).start();

      validateCreateModelWithRelationship({ table: 'test' }, 'testProp', 'belongsTo', targetComponent);
    });

    it('belongsToMany should be converted to bookshelf belongsToMany', () => {
      const model = {
        table: 'test',
        testProp: {
          relationshipType: 'belongsToMany',
          target: 'target-component-name'
        }
      };

      new BookshelfModel(mockContainer, model).start();

      validateCreateModelWithRelationship({ table: 'test' }, 'testProp', 'belongsToMany', targetComponent);
    });


  });
});