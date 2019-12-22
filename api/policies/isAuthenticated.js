/**
 * isuthenticated.js
 *
 * @description :: policy that checks the headers for Bearer {JWT TOKEN} format
 */
module.exports = async function(req, res, next) {
  let token;
  //Check if authorization header is present
  if (req.headers && req.headers.authorization) {
    //authorization header is present
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2) {
      const scheme = parts[0];
      const credentials = parts[1];

      if (/^Bearer$/i.test(scheme)) {
        token = credentials;
      }
    } else {
      return res.status(401).json({ err: 'Format is Authorization: Bearer [token]' });
    }
  } else {
    //authorization header is not present
    return res.status(401).json({ err: 'No Authorization header was found' });
  }
  try {
    const decoded = await sails.helpers.jwtVerify(token);
    const user = decoded.data;
    //check that the user exists in our system and the token matches.
    const userRecord = await User.findOne({ id: user.id });
    if (!userRecord.isPhoneVerified) {
      return res.status(401).json({ err: 'Phone is not verified' });
    }
    if (userRecord.encryptedPassword === user.encryptedPassword) {
      req.user = userRecord;
      return next();
    } else {
      return res.status(401).json({ err: 'Invalid token' });
    }
  } catch (err) {
    return res.status(401).json({ err: 'Invalid token' });
  }
};
