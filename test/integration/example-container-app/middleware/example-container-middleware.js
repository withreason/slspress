'use strict';

const boilerplate = require('../../../../container-index');

const ContainerRequestMiddleware = boilerplate.ContainerRequestMiddleware;
const BadRequestError = boilerplate.BadRequestError;

class ValidateIdParam extends ContainerRequestMiddleware {

  process(container, next) {
    const event = container.fetch('serverless/event');

    const id = parseInt(event.pathParameters.id);

    return isNaN(id) ?  Promise.reject(new BadRequestError()) : Promise.resolve(true);
  }
}
module.exports = ValidateIdParam;