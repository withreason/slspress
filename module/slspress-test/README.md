# slspress test

A collection of useful testing utilities to aid in the testing of serverless projects.

## ServerlessOfflineManager
Use this to start and stop [Serverless Offline](https://github.com/dherault/serverless-offline) instances from your tests. 
This allows you to run integration tests against a local version of your code using 
[Serverless Offline](https://github.com/dherault/serverless-offline). Both your serverless code and
tests will run in the same node process making debugging a bit easier and as you write plain mocha tests IDEs 
with Mocha support integrate well. 

### Usage
Example using ServerlessOfflineManager with chai and request to test an endpoint. The global before and after functions
will start and stop a serverless application in the current working directory prior to and after running all of your tests. 

```javascript
const OfflineManager = require('slspress-test').ServerlessOfflineManager;
const expect = require('chai').expect;
const request = require('request-promise-native');

describe('Integration Test', function() {
  this.timeout(1000 * 10);

  const offlineManager = new OfflineManager();

  let testUrl = null;
  before(() => offlineManager.start(environment).then(url => testUrl = url));
  after(() => offlineManager.stop());

  it('tests something', function () {
    return request(`${testUrl}/some/url`)
      .then(body => expect(body).to.equal('Something'));
  });
});
```
#### Passing properties
You can pass properties to serverless offline by adding a constructor argument. For example if the application 
you wish to test is not in the working directory you could do something like this `new OfflineManager({ serverless: { servicePath: __dirname + '/your-app' }})`.


## jwtRequest

This function allows easier testing of endpoints protected by the slspress-jwt-authorizer module

You call the function with a base url and private key and it will return an object that you can call 
get, post, patch and del on. All of the methods take a identityObject property that is encrypted with 
the private key on each request.

Example usage:

```javascript
const { jwtRequest } = require('slspress-test');

const somePrivateKey = '';// load this from some props of something.
const testUrl = 'http://localhost:3000';// load this from some props of something.

const request = jwtRequest(testUrl, somePrivateKey);

it('returns a list of users', () => {
  return request.get({
    identityObject: { sub: 'user1' },
    uri: `/users`
  }).then(body => {
    // some assertions
  });
});

it('create a user', () => {
  return request.post({
    identityObject: { sub: 'user1' },
    uri: `/users`,
    body: { some: 'user object' },
    expectedStatusCode: 201 // if not given validates 2xx
  }).then(body => {
    // some assertions
  });
});

it('update a user', () => {
  return request.patch({
    identityObject: { sub: 'user1' },
    uri: `/users/some-id`,
    body: { some: 'user object' },
  }).then(body => {
    // some assertions
  });
});

it('replace a user', () => {
  return request.put({
    identityObject: { sub: 'user1' },
    uri: `/users/some-id`,
    body: { some: 'user object' },
  }).then(body => {
    // some assertions
  });
});

it('delete a user', () => {
  return request.del({
    identityObject: { sub: 'user1' },
    uri: `/users/some-id`
  }).then(body => {
    // some assertions
  });
});

```
