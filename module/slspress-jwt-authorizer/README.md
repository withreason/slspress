
#slspress-jwt-authorizer

#createRS256BearerAuthorizer

Creates an authorizer that provides access based on a valid JWT bearer token from auth0.
Only the RS256 algorithm is supported.

Usage: 

```javascript
const { create } = require('slspress');
const { createRS256BearerAuthorizer } = require('slspress-jwt-authorizer');
const app = create();

const auth0PublicKey = '';// load this from some props of something.

app.on('authorizer').authorizer(createRS256BearerAuthorizer(auth0PublicKey));

module.exports = app.export();
```