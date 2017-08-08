'use strict';

const { NotFoundError } = require('../../../..');

module.exports = function(req, res) {
  if (!req.event.pathParameters.id) {
    throw new NotFoundError('id');
  }
  return this.component('components/resources/fake-database')
    .find(req.event.pathParameters.id)
    .then(res.send.bind(res))
    .catch(res.handleError.bind(res));
};