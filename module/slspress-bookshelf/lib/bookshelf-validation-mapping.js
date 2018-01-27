const { UnprocessableEntityError } = require('slspress');

module.exports.create = () => err => {
  if (err.name === 'ValidationError' && err.isJoi) {
    const errorDetail = err.details.map(detail => detail.message).join('\n');
    throw new UnprocessableEntityError(`The entity failed validation for the following reasons:\n${errorDetail}`);
  }
  throw err;
};

module.exports.suppress = (defaultObj) => err => {
  if (err.name === 'ValidationError' && err.isJoi) {
    return defaultObj;
  }
  throw err;
};