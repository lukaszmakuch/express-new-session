[![travis](https://travis-ci.org/lukaszmakuch/express-new-session.svg)](https://travis-ci.org/lukaszmakuch/express-new-session)

# express-new-session
This middleware generates a new session.

## What's that?
It calls the _req.session.regenerate_ method of [express-session](https://github.com/expressjs/session) for _all methods except GET_. It provides a totally new session with different id.

There's a way to specify a list of keys that are going to be preserved. It makes it possible to obtain a new session that contains some of the data that was stored within the old session.

## Examples
The most complex example looks like this:
```js
const newSession = require('express-new-session')

//...

const preservedKeys = ["fontSize", "helpClosed"]
app.all('/login', newSession({preservedKeys}), (req, res) => {
  //...
})
```

It does nothing, if the _/login_ page is just displayed, because _GET_ requests are simply ignored by this middleware. But in every other case, it generates a new session before control is passed to the next middleware. Two session variables are preserved: _fontSize_ and _helpClosed_. These are the only variables that will be available to the second middleware within the req.session variable.

Options are optional, so if we don't need to preserve any session keys, we can skip them:
```js
app.all('/login', newSession(), (req, res) => {
  //...
})
```

## How to get it?
```
$ npm i express-new-session --save
```
