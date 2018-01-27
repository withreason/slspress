const { createLogger, Component } = require('slspress');
const BookshelfComponent = require('./bookshelf');
const logger = createLogger(__filename);

class BookshelfModelComponent extends Component {
  constructor(container, modelDefinition, bookshelfComponentName) {
    super();
    this._container = container;
    this._modelDefinition = modelDefinition;
    this._bookshelfComponentName = bookshelfComponentName || BookshelfComponent.NAME;
  }

  start() {
    logger.trace('[BookshelfDao] start. Creating component', this._modelDefinition);

    // overwrite relationship keys with bookshelf relationships.
    const relationships = {};
    Object.keys(this._modelDefinition).forEach(key => {
      const val = this._modelDefinition[key];
      if (val.relationshipType && val.target) {
        logger.trace(`[BookshelfDao] converting relationship property ${key}`);
        const container = this._container;
        const additionalArgs = val.additionalInfo || [];
        relationships[key] = function() {
          return this[val.relationshipType].apply(this, [container.fetch(val.target)].concat(additionalArgs));
        }
      }
    });
    const modelDefinition = Object.assign({}, this._modelDefinition, relationships);

    return this._container.fetch(this._bookshelfComponentName).createModel(modelDefinition);
  }
}

module.exports = BookshelfModelComponent;