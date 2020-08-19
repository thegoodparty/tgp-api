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
  // 'seed/*': ['isAuthenticated', 'isAdmin'],
  'role/*': ['isAuthenticated', 'isAdmin'],
  '*': ['isAuthenticated'], // Restrict all but routes below
  // public access
  'entrance/*': true,
  'content/*': true,
  'notifications/*': true,
  'district/*': true,
  'incumbent/*': true,
  'presidential/*': true,
  'race-candidate/*': true,
  'candidates/*': true,
  'counts/*': true,
  'seed/*': true,
  'scrape/*': true,
};
