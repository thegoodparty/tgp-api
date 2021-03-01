/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */

module.exports.policies = {
  /***************************************************************************
   *                                                                          *
   * Default policy for all controllers and actions, unless overridden.       *
   * (`true` allows public access)                                            *
   *                                                                          *
   ***************************************************************************/

  'admin/*': ['isAuthenticated', 'isAdmin'],
  'candidate/create': ['isAuthenticated', 'isAdmin'],
  'candidate/update': ['isAuthenticated', 'isAdmin'],
  'newCandidate/update': ['isAuthenticated', 'isAdmin'],
  'newCandidate/create': ['isAuthenticated', 'isAdmin'],
  // 'seed/*': ['isAuthenticated', 'isAdmin'],
  'role/*': ['isAuthenticated', 'isAdmin'],
  '*': ['isAuthenticated'], // Restrict all but routes below
  // public access
  'entrance/*': true,
  'content/*': true,
  'notifications/*': true,
  'incumbent/*': true,
  'presidential/*': true,
  'race-candidate/*': true,
  'candidates/*': true,
  'newCandidates/find': true,
  'newCandidates/homepage-candidates': true,
  'newCandidates/list': true,
  'counts/*': true,
  'seed/*': true,
  'scrape/*': true,
  'subscribe/*': true,
  'user/support/list-by-candidate': true,
};
