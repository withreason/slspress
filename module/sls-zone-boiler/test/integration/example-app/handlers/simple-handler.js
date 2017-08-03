'use strict';

const { rawHandler } = require('../../../..');

module.exports = rawHandler(function(event, context, callback) {
  return callback(null, { statusCode: 200, body: 'Simple handler response'});
});