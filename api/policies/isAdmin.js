/**
 * isAdmin.js
 *
 * @description :: policy that ensures that the user email is in the ENV variable ADMIN_EMAILS array.
 * locally we use /config/local file to store this array. On production we need to set the ENV variables.
 */

module.exports = async function (req, res, next) {
  // req.user should already be there since isAuthenticated should be called before this
  if (!req.user?.isAdmin) {
    return res.status(401).send('Admin permission access required');
  }
  return next();
};
