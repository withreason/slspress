
const { handler } = require('slspress');

module.exports.promise = (reqToPromise) => handler((req, res) => {
  return reqToPromise(req)
    .then(result => res.send(result))
    .catch(res.handleError);
});

module.exports.promiseMiddleware = (reqResToPromise) => (req, res, next) => {
  return reqResToPromise(req, res)
    .then(next)
    .catch(res.handleError);
};