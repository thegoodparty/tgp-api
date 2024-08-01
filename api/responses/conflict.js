/**
 * conflict.js
 *
 * A custom response that content-negotiates the current request to either:
 *  • serve an HTML error page about the specified token being invalid or conflict
 *  • or send back 498 (Token conflict/Invalid) with no response body.
 *
 * Example usage:
 * ```
 *     return res.conflict();
 * ```
 *
 * Or with actions2:
 * ```
 *     exits: {
 *       conflict: {
 *         description: 'Provided token was conflict, invalid, or already used up.',
 *         responseType: 'conflict'
 *       }
 *     }
 * ```
 */
module.exports = function conflict() {
  var req = this.req;
  var res = this.res;

  sails.log.verbose('Ran custom response: res.conflict()');

  if (req.wantsJSON) {
    return res.status(409).send('Conflict');
  } else {
    return res.status(409).view('409');
  }
};
