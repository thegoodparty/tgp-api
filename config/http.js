/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For more information on configuration, check out:
 * https://sailsjs.com/config/http
 */

module.exports.http = {
  /****************************************************************************
   *                                                                           *
   * Sails/Express middleware to run for every HTTP request.                   *
   * (Only applies to HTTP requests -- not virtual WebSocket requests.)        *
   *                                                                           *
   * https://sailsjs.com/documentation/concepts/middleware                     *
   *                                                                           *
   ****************************************************************************/

  middleware: {
    /***************************************************************************
     *                                                                          *
     * The order in which middleware should be run for HTTP requests.           *
     * (This Sails app's routes are handled by the "router" middleware below.)  *
     *                                                                          *
     ***************************************************************************/
    requireHttps: function (req, res, next) {
      if (
        req.headers['x-forwarded-proto'] !== undefined &&
        req.headers['x-forwarded-proto'] === 'http'
      ) {
        return res.redirect('https://' + req.get('host') + req.url);
      }

      return next();
    },

    order: [
      'cookieParser',
      'tokenExtractor',
      'session',
      'bodyParser',
      'compress',
      'poweredBy',
      'requireHttps',
      'router',
      'www',
      'favicon',
    ],
    /***************************************************************************
     *                                                                          *
     * The body parser that will handle incoming multipart HTTP requests.       *
     *                                                                          *
     * https://sailsjs.com/config/http#?customizing-the-body-parser             *
     *                                                                          *
     ***************************************************************************/
    // bodyParser: (function _configureBodyParser(){
    //   var skipper = require('skipper');
    //   var middlewareFn = skipper({ strict: true });
    //   return middlewareFn;
    // })(),

    // cookieParser: cookieParser(),

    // Custom middleware to extract the jwt token from the "token" cookie and add it as an authorization header to the request
    tokenExtractor: function (req, res, next) {
      const appBase = sails.config.custom.appBase || sails.config.appBase;
      let tokenCookieName = 'token';
      if (appBase === 'https://goodparty.org') {
        tokenCookieName = 'token_prod';
      } else if (appBase === 'https://dev.goodparty.org') {
        tokenCookieName = 'token_dev';
      } else if (appBase === 'https://qa.goodparty.org') {
        tokenCookieName = 'token_qa';
      }

      if (
        req.cookies &&
        req.cookies[tokenCookieName] &&
        !req.cookies?.impersonateToken
      ) {
        const token = req.cookies[tokenCookieName]; // Get the token from the cookie
        if (token) {
          req.headers.authorization = `Bearer ${token}`; // Set the token as an Authorization header
        }
      }
      return next();
    },
  },
};
