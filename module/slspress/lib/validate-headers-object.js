'use strict';

module.exports = headers => {
  if (typeof headers !== 'object') {
    throw new Error('The object passed to headers must be an object');
  }
  Object.keys(headers).forEach(key => {
    const value = headers[key];
    if (typeof key !== 'string' || typeof value !== 'string') {
      throw new Error('The object passed to headers must be a string to string map.');
    }
  });
  return headers;
};