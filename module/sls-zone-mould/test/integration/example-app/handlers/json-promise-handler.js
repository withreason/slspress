'use strict';

const NotFoundError = require('../../../..').NotFoundError;

module.exports = (event, context) => {

  if (event.body.testParam === 'test-1') {
    return Promise.resolve({ result: 'test-result-1' })
  }
  return Promise.reject(new NotFoundError('body.testParam'));
};