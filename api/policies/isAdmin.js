/**
 * isAdmin.js
 *
 * @description :: policy that ensures that the user email is in the ENV variable ADMIN_EMAILS array.
 * locally we use /config/local file to store this array. On production we need to set the ENV variables.
 */

const errorMsg = '';

module.exports = async function (req, res, next) {
  let token;

  if (req.headers && req.headers.authorization) {
    //authorization header is present
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2) {
      const scheme = parts[0];
      const credentials = parts[1];

      if (/^Bearer$/i.test(scheme)) {
        token = credentials;
        try {
          const decoded = await sails.helpers.jwtVerify(token);
          const reqEmail = decoded?.data?.email;
          //check if the email host is @goodparty.org if so, check the user.isAdmin flag
          if (reqEmail && reqEmail.includes('@goodparty.org')) {
            const user = await User.findOne({ email: reqEmail });
            if (user && user.isAdmin) {
              return next();
            }
          }

          const adminEmails =
            sails.config.custom.adminEmails || sails.config.adminEmails;
          if (
            decoded &&
            decoded.data &&
            adminEmails &&
            adminEmails.includes(reqEmail)
          ) {
            return next();
          } else {
            return res.status(401).send('Admin permission access required1');
          }
        } catch (err) {
          return res.status(401).send('Admin permission access required2');
        }
      } else {
        return res.status(401).send('Admin permission access required3');
      }
    } else {
      return res.status(401).send('Admin permission access required4');
    }
  } else {
    return res.status(401).send('Admin permission access required5');
  }
};
