'use strict';

const Response = require('./response');

module.exports = (req, callback, handleErrorFn , headers) => {
  return new Response(req, callback, handleErrorFn , headers);
};