'use strict';

const wrappers = require('../config/application-config-wrappers');

/**
 * Returns middleware that ensures that request and response bodies are decoded / encoded to JSON
 */
module.exports = [
  wrappers.request(function(req, res, next) {
    if (req.event.body && typeof req.event.body === 'string') {
      req.event.body = JSON.parse(req.event.body)
    }
    return next();
  }),
  wrappers.response(function(req, res, next) {
    if (res && res.body) {
      res.update(JSON.stringify(res.body));
    }
    return next();
  })
];