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

    customBodyParser: function (req, res, next) {
      if (req.headers['stripe-signature']) {
        return next();
      }
      return require('skipper')()(req, res, next);
    },

    order: [
      'cookieParser',
      'session',
      'customBodyParser',
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
  },
};
