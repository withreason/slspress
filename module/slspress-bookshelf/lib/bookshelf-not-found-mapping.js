const { NotFoundError } = require('slspress');

module.exports.create = (model, id) => err => {
  if (err instanceof model.NotFoundError
    || err instanceof model.NoRowsUpdatedError
    || err instanceof model.NoRowsDeletedError
    || err === 'NOT_FOUND') {
    throw new NotFoundError(`${model.prototype.tableName} object with id ${id}`);
  }
  throw err;
};

module.exports.suppress = (model, defaultObj) => err => {
  if (err instanceof model.NotFoundError
    || err instanceof model.NoRowsUpdatedError
    || err instanceof model.NoRowsDeletedError
    || err === 'NOT_FOUND') {
    return defaultObj;
  }
  throw err;
};