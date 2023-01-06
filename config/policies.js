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
  'newCandidates/create': ['isAuthenticated', 'isAdmin'],
  'newCandidates/delete': ['isAuthenticated', 'isAdmin'],
  'topIssues/*': ['isAuthenticated', 'isAdmin'],
  'topIssues/candidatePosition/*': ['isAuthenticated'],
  '*': ['isAuthenticated'], // Restrict all but routes below
  // public access
  'general/*': true,
  'entrance/*': true,
  'content/*': true,
  'newCandidates/find': true,
  'newCandidates/homepage-candidates': true,
  'newCandidates/list': true,
  'seed/*': true,
  'subscribe/*': true,
  'topIssues/topIssue/list': true,
  'topIssues/position/list': true,
  'visit/*': true,
  'newCandidates/application/upload-image': true, // for guest applications
  'socialListening/*': true,
  'campaign/claim/claim': true,
};
