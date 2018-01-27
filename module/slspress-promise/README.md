
#slspress-promise

An extension to slspress that adds the ability to return a promise from handlers or middleware rather than interact
with the response object directly. This is particularly useful when interacting with data stores.

## Handler
If the returned promise is rejected then the rejection payload is forwarded to the error handler. If the 
promise succeeds then the payload of the response is considered to be the body and the same logic as res.send is applied.
That is if the body does not exist then 204 is returned. if it does 200 is returned unless it was a POSt in which case 201
is returned.

Example Usage: 

```javascript
const { create } = require('slspress');
const { promise } = require('slspress-promise');
const app = create();

app.on('someFunc').get('/articles/{id}', promise(req => {
    //for example fetch something from a db that returns a promise
    return db.getArticle(req.event.pathParameters.id);
}));

module.exports = app.export();
```

## Middleware
Instead of a function that takes a request, response and next parameter only the request and response objects are required.

If the returned promise is rejected then the rejection payload is forwarded to the error handler. If the 
promise succeeds then the payload of the promise is ignored and the next middleware or handler in the chain is called.

Example Usage: 

```javascript
const { create, BadRequestError } = require('slspress');
const { promiseMiddleware } = require('slspress-promise');
const app = create();

const validateId = promiseMiddleware((req, res) => db.articleExists(req.event.pathParameters.id)
    .then(exists => {
       if (!exists) {
           throw new BadRequestError('The given article id does not exist.')
       }
    }));

app.on('someFunc').middleware(validateId).get('/articles/{id}', require('./some-handler'));


module.exports = app.export();
```