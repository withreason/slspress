'use strict';

const { BadRequestError } = require('../../../..');

module.exports = (req, res, next) => {
  const id = parseInt(req.event.pathParameters.id);
  if (isNaN(id)) {
    throw new BadRequestError();
  }
  return next();
};