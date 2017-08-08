# slspress - part of sls-zone
A library for rapidly developing Serverless applications inspired by express. 

Frustrated by some of the serverless gotchas? Wondering where middleware, error handling and lifecycle msuccessfuls? or 
just not sure where to start with serverless? Look no further. This library looks to address these points whilst
maintaining a very small footprint.

## Objectives
* To enable developers to rapidly create serverless applications by providing a recommended approach and set of 
useful boilerplate code.
* To be as small and lightweight as possible with very few dependencies and overhead.

## Features
* Middleware chains - *move common logic across multiple http calls into one place for reuse across multiple endpoints
(request, response and finally middleware chains are available).*
* Centralised exception handling - *automatically have errors caught and forwarded to an error handler where they can
be processed in the same place and with the same code as errors from your other endpoints.*
* IoC container - *reduce the need for manual dependency injection by using the provided container*
* Lifecycle management - *create components that are automatically started and stopped either side of your executing
function. Never leave that db connection hanging again.*
* Routing - *use one function to easily service multiple events. Sometimes it makes sense to split them up sometimes it doesn't.
When it doesn't then don't! (your function is less likely to cold start)*
* Logging - *simple configurable log filtering.*
* Mix and match existing functions with slspress functions - *plain serverless functions are fully supported
(with added middleware and exception handling!).*

## Why slspress
There are so many node libraries out there solving all sorts of problems including many of those solved by this one.
Why do we need another?

Put simply there additional considerations when using serverless that make many existing libraries unsuitable or hard 
to use in a serverless environment. 
* To start with most libraries and frameworks dont just plug into a serverless environment.
Granted you could probably write adapters but that takes time.
* Many libraries have huge dependency lists. This may not matter when the server is restarted infrequently but with 
serverless it can make a big difference. Executors are started and stopped on demand by the provider when a http 
request is made . You want your code to be a lean as possible to minimise the impact of "cold starts". 

## Getting started
There are a few simple examples of usage below however they assume that you have a working knowledge of serverless.
A more extensive tutorial will be coming soon to the sls-zone website.

###Examples
An slspress handler file is designed to look very much like an express application. You create your app, you define 
some common middleware, potentially provide your own error handler and then list the handlers that you want to export.
Its worth noting that slspress does not interact with the serverless.yml file at all so routes still need to be 
defined there.

#### Hello World

The below module would export the 'hello' handler that could be referenced from a serverless.yml

```javascript
const app = require('slspress').create();
app.on('hello').use((req, res) => res.ok('Hello!'));
module.exports = app.export();
```

#### Using request middleware
This shows an example of how to add middleware at the global scope and function scope. 

```javascript
const {create, BadRequestError} = require('slspress');
const app = create();

app.middleware(require('some-middleware'));

app.middleware((req, res, next) => {
  //do some request validation
  if (!req.event.body) {
    throw new BadRequestError();
  }
  return next();
});

app.on('function-with-global-middleware').use((req, res) => res.ok('Hello!'));

app.on('function-with-extra-middleware')
  .middleware(require('extra-middleware'))
  .use((req, res) => res.ok('Hello!'));

module.exports = app.export();
```

#### Using response and finally middleware
This shows an example of how to add response and finally middleware at both the global and function scope. 

```javascript
const {create, responseMiddleware, finallyMiddleware } = require('slspress');
const app = create();

app.middleware(responseMiddleware(require('some-response-middleware')));
app.middleware(finallyMiddleware(require('some-finally-middleware')));

app.middleware(responseMiddleware((req, res, next) => {
  // add some extra headers for a successful response
  res.headers({'all-good': 'yes'});
  return next();
}));

app.on('function-with-global-middleware').use((req, res) => res.ok('Hello!'));

app.on('function-with-extra-middleware')
  .middleware(
    finallyMiddleware('extra-finally-middleware'),
    responseMiddleware(require('extra-response-middleware')))
  .use((req, res) => res.ok('Hello!')
);

module.exports = app.export();
```

#### Defining a custom error handler
This following provides a custom error handler

```javascript
const app = require('slspress').create();

app.onError((req, res) => {
  if (req.error instanceof MyError) {
    return res.notFound();
  }
  return res.internalServerError();
});

app.on('hello').use((req, res) => res.ok('Hello!'));

module.exports = app.export();
```

#### Adding headers to the response
This shows how headers can be added at both the global and function scope.

```javascript
const app = require('slspress').create();

app.headers({'Api-Version': '1.0.0'});

app.on('hello')
  .headers({'Hello': 'true'})
  .use((req, res) => res.ok('Hello!'));

module.exports = app.export();
```

#### Adding an authorizer

```javascript
const {create, createAuthorizerResponse } = require('slspress');
const app = create();

app.on('authorizer')
  .authorizer((event, context, callback) => {
    // very insecure! If the authorization header is present we are authorized and our user id is the value of the auth token!
    return createAuthorizerResponse(event.authorizationToken, event.authorizationToken, event, callback);
  });

module.exports = app.export();
```

#### Using with scheduled events

Scheduled events can be attached to any existing handler. 
The following will limit the handler to only match scheduled task events so a combination of cron and use can
be added to the function to allow it to handle both.

```javascript
const { create, rawHandler } = require('slspress');
const app = create();

app.on('existing-name')
  .cron(require('cron-handler'));

module.exports = app.export();
```

#### What about my existing functions?
They can simply live side by side in a separate handler file or be plugged in like below 
and get middleware chains and an error handler too!

```javascript
const { create, rawHandler } = require('slspress');
const app = create();

app.on('existing-name')
  .use(rawHandler(require('existing-serverless-handler')));

module.exports = app.export();
```

#### Routing multiple events through a single function
This example shows a single handler function that deals with all of
a rest endpoints actions.

```javascript
const { create } = require('slspress');
const app = create();

app.on('existing-name')
  .post('/my-rest-endpoint', require('create-handler'))
  .get('/my-rest-endpoint/{id}', require('show-handler'))
  .patch('/my-rest-endpoint/{id}', require('update-handler'))
  .delete('/my-rest-endpoint/{id}', require('delete-handler'))

module.exports = app.export();
```

#### Using a component to manage a database connection.
This example shows an example approach of using a component to manage a db connection.

```javascript
const { create, Component } = require('slspress');

const MyDb = class extends Component {
  constructor(container) {
    super();
    // get any deps from the IoC container using container.fetch().
  }
  
  start() {
    return new Promise((resolve, reject) => {
      try {
        db.connect(function onSuccess() {
          resolve();
        })
      } catch (e) {
        reject(e);
      }
    });
  }
  
  stop() {
    // disconnect promise
    return db.disconnect();
  }
  
  find(id) {
    // do something that returns a promise.
  }
};


const app = create();

app.component('component/resource/db', MyDb);

app.on('hello').use(function(req, res) {
  this.component('component/resource/db').find('stuff')
  .then(data => res.send(data))
  .catch(e => res.handleError(e))
});

module.exports = app.export();
```













