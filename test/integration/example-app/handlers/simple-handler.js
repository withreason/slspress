'use strict';

const ResponseFactory = require('../../../..').ResponseFactory;

module.exports = (event, context, callback) => {
  return new ResponseFactory().ok('Simple handler response').send(callback);
};