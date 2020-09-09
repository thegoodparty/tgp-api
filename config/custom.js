/**
 * Custom configuration
 * (sails.config.custom)
 *
 * One-off settings specific to your application.
 *
 * For more information on custom configuration, visit:
 * https://sailsjs.com/config/custom
 */

const ONE_HOUR = 60 * 60 * 1000;

module.exports.custom = {
  /**************************************************************************
   *                                                                         *
   * The TTL (time-to-live) for various sorts of tokens before they expire.  *
   *                                                                         *
   **************************************************************************/
  passwordResetTokenTTL: 24 * ONE_HOUR * 30, // 1 month

  /**************************************************************************
   *                                                                         *
   * Roles Model Enums  *
   *                                                                         *
   **************************************************************************/
  rolesEnums: {
    VOTER: 10,
    CANDIDATE: 20,
    ADMIN: 30,
  },
  adminPhones: ['3109759102'],
  // adminEmails: ['blueshark0811@gmail.com'],
  jwtSecret: 'Xd3*+Hzu9(LF^DN,',

  /***************************************************************************
   *                                                                          *
   * Any other custom config this Sails app should use during development.    *
   *                                                                          *
   ***************************************************************************/

  mailgunDomain: 'sandboxbcb5d5c9a3034d638e5854b64c476b8b.mailgun.org',
  appBase: 'https://dev.thegoodparty.org',
};
