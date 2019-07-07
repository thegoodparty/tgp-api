/**
 * isAdmin.js
 *
 * @description :: policy that ensures that the user email is in the ENV variable ADMIN_EMAILS array.
 * locally we use /config/local file to store this array. On production we need to set the ENV variables.
 */

module.exports = function(req, res, next) {
  let token;

  if(req.headers && req.headers.authorization) {
    //authorization header is present
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2) {
      const scheme = parts[0];
      const credentials = parts[1];

      if (/^Bearer$/i.test(scheme)) {
        token = credentials;
        jwToken.verify(token, (err, decoded) => {
          if(err) {
            return res.status(401).send('Admin permission access required');
          }
          if(decoded.data && sails.config.ADMIN_EMAILS.includes(decoded.data.email)){
            return next();
          } else {
            return res.status(401).send('Admin permission access required');
          }
        });
      } else {
        return res.status(401).send('Admin permission access required');
      }

    } else {
      return res.status(401).send('Admin permission access required');
    }

  } else {
    return res.status(401).send('Admin permission access required');
  }

};
