const { USER_ROLES } = require('../models/users/User');

module.exports = async function ({ user }, res, next) {
  if (user?.role !== USER_ROLES.SALES && !user?.isAdmin) {
    return res.status(401).send('Admin or Sales role required');
  }
  return next();
};
