const { UnprocessableEntityError } = require('slspress');

module.exports.create = () => err => {
  if (err === 'EMPTY_REQUEST') {
    throw new UnprocessableEntityError(`An update was requested but there were no updateable fields present`);
  }
  throw err;
};

module.exports.suppress = (defaultObj) => err => {
  if (err === 'EMPTY_REQUEST') {
    return defaultObj;
  }
  throw err;
};