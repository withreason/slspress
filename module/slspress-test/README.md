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



