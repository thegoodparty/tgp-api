const CRON_SECRET = sails.config.custom.cronSecret || sails.config.cronSecret;
module.exports = async function (req, res, next) {
  return req.headers?.authorization &&
    req.headers?.authorization.startsWith(`Bearer ${CRON_SECRET}`)
    ? next()
    : res.status(401).json({ err: 'Unauthorized' });
};
