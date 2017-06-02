var assert = require("assert");
var makeMiddleware = require("./src");

function forAnythingButGet(cb) {
  //for many methods but GET
  var methods = ["POST", "PUT", "DELETE", "ANYTHING_BUT_GET"];
  for (var i = 0; i < methods.length; i++) {
    var method = methods[i];
    cb(method);
  }
};

describe("middleware that regenerates the session", function () {
  var middleware, nextCalled, nextParam, sessionRegenerated, req,
    errorWhenRegenerating, startRegenerating;

  //building the session test double
  beforeEach(function () {
    req = {};
    nextCalled = false;
    sessionRegenerated = false;
    errorWhenRegenerating = false;
    nextParam = undefined;
    startRegenerating = function () {};
    var newSessionObj = function () {
      req.session = {};
      req.session.regenerate = function (cb) {
        startRegenerating = function () {
          if (errorWhenRegenerating) return cb(errorWhenRegenerating);
          sessionRegenerated = true;
          newSessionObj();
          cb();
        };
      };
    };
    newSessionObj();
  });

  function next (param) {
    nextCalled = true;
    nextParam = param;
  };

  it("throws an error if there's no session", function () {
    middleware = makeMiddleware();
    middleware({method: "POST"}, null, next);
    startRegenerating();

    assert.equal(
      "req.session not found. Didn't you forget to use express-session?",
      nextParam.message
    );
  })

  it("it transparent to GET requests", function () {
    middleware = makeMiddleware();

    req.method = "GET";
    var res = null;
    req.session.a = 123

    middleware(req, res, next);
    startRegenerating();

    assert(nextCalled);
    assert.equal(123, req.session.a);
  });

  forAnythingButGet(function (method) {
    describe( method + " method", function () {

      it("regenerates the whole session", function () {
        middleware = makeMiddleware();
        req.method = method;
        var res = null;

        req.session.a = 123;
        req.session.b = "abc";

        middleware(req, res, next)

        //at the beginning there's no change
        assert.equal(123, req.session.a);
        assert.equal("abc", req.session.b);

        //then the regenerating process starts and it succeeds
        startRegenerating();

        //the session has been regenerated
        assert(sessionRegenerated);

        //previous variablse are not accessible
        assert(undefined === req.session.a);
        assert(undefined === req.session.b);
      })

      it("preserves the specified keys", function () {
        middleware = makeMiddleware({
          preservedKeys: ["a", "c"]
        });
        req.method = method;
        var res = null;

        req.session.a = "a";
        req.session.b = "b";
        req.session.c = "c";

        middleware(req, res, next)

        //the regenerating process starts and it succeeds
        startRegenerating();

        //the session has been regenerated
        assert(sessionRegenerated);

        //only the specified keys has been preserved
        assert.equal("a", req.session.a);
        assert(undefined === req.session.b);
        assert.equal("c", req.session.c);
      })

      it("is transparent to errors occuring while regenerating", function () {
        middleware = makeMiddleware();

        req.method = method;
        var res = null;
        errorWhenRegenerating = new Error("something went wrong");

        middleware(req, res, next);
        startRegenerating();

        assert(!sessionRegenerated);
        assert(errorWhenRegenerating === nextParam);
      });

    })
  })
});
