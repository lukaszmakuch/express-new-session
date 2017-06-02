module.exports = function (opts) {

  //the actual middleware
  return function (req, res, next) {

    //it's transparent to GET requests
    if (req.method === "GET") {
      return next();
    }

    //the session must be present
    if (!req.session) {
      return next(new Error("req.session not found. Didn't you forget to use express-session?"));
    }

    //store all the data that's meant to be preserved
    var keysToPreserve = (opts || {}).preservedKeys || [];
    var preservedSessionVariables = {};
    for (var i = 0; i < keysToPreserve.length; i++) {
      var key = keysToPreserve[i];
      preservedSessionVariables[key] = req.session[key];
    }

    //regenerate the session
    req.session.regenerate(function (err) {
      //if it failed, simply return the error
      if (err) return next(err);

      //restore the preserved data
      for (var key in preservedSessionVariables) {
        req.session[key] = preservedSessionVariables[key];
      }

      //go to the next middleware
      next();
    });
  };

};
