/**
 * Service to generate JWT
 */
const jwt = require('jsonwebtoken');

const ONE_DAY = 60 * 60 * 24;

module.exports = {
  'sign': function (payload) {
    return jwt.sign({
      data: payload
    }, sails.config.secret, {expiresIn: ONE_DAY});
  },
  'verify': function (token, callback) {
    jwt.verify(token, sails.config.secret, callback);
  },

};
