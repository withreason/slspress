
const buildPolicy = (event, userId, effect) => {
  const authResponse          = {};
  authResponse.principalId    = 'user';
  const policyDocument        = {};
  policyDocument.Version      = '2012-10-17'; // default version
  policyDocument.Statement    = [];
  const statementOne          = {};
  statementOne.Action         = 'execute-api:Invoke'; // default action
  statementOne.Effect         = effect;
  statementOne.Resource       = (event.methodArn.split('/').slice(0, 2).join('/') + '/*/*');
  policyDocument.Statement[0] = statementOne;
  authResponse.policyDocument = policyDocument;
  authResponse.context        = { id: userId };
  return authResponse;
};

/**
 * Create a simple authentication response for an authenticator
 * @param authorized a boolean indicating whether the response should indicate the user is authenticated.
 * @param userId the id of the authorized use if authorized.
 * @param event The serverless event object
 * @param callback the serverless callback object.
 * @returns {*} the result of the serverless callback.
 */
module.exports = (authorized, userId, event, callback) => {
  if (!authorized) {
    return callback('Unauthorized');
  }
  return callback(null, buildPolicy(event, userId, 'Allow'));
};