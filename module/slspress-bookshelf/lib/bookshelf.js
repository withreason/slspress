const {createLogger, Component } = require('slspress');
const logger = createLogger(__filename);

const knex = require('knex');
const bookshelf = require('bookshelf');
const bookshelfJsonColumns = require('bookshelf-json-columns');
const bookshelfModelBase = require('bookshelf-modelbase');
const createValidationFix = require('./bookshelf-modelbase-create-validation-fix');
const bookshelfModelBasePlus = require('bookshelf-modelbase-plus');
const pagination = require('bookshelf/lib/plugins/pagination');

const defaultKenxOpts = {
  pool: { min: 0, max: 1 },
  acquireConnectionTimeout: 5000
};

class BookshelfComponent extends Component {
  static get NAME() {
    return 'resources/bookshelf';
  }

  constructor(container, knexOpts) {
    super();
    this._knexOpts = Object.assign({}, defaultKenxOpts, knexOpts);
    this._knex = null;
    this._bookshelf = null;
    this._ModelBase = null;
  }

  start() {
    logger.trace('[BookshelfComponent] start. Knex options', this._knexOpts);
    this._knex = knex(this._knexOpts);
    this._bookshelf = bookshelf(this._knex);
    this._bookshelf.plugin(bookshelfJsonColumns);
    this._bookshelf.plugin(bookshelfModelBasePlus);
    this._bookshelf.plugin(pagination);
    this._ModelBase = createValidationFix(bookshelfModelBase(this._bookshelf));
  }

  stop() {
    logger.trace('[BookshelfComponent] stop.');
    return this._knex.destroy();
  }

  createModel(modelDefinition) {
    if (!this._ModelBase) {
      throw new Error('BookshelfComponent.start must be called before createModel');
    }
    return this._ModelBase.extend(modelDefinition);
  }

  transaction(transactionFn) {
    return this._bookshelf.transaction(transactionFn);
  }

}

module.exports = BookshelfComponent;