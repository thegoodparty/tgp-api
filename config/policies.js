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
  'newCandidates/update': ['isAuthenticated', 'isAdmin'],
  'newCandidates/create': ['isAuthenticated', 'isAdmin'],
  'newCandidates/delete': ['isAuthenticated', 'isAdmin'],
  'user/support/admin-delete': ['isAuthenticated', 'isAdmin'],
  'newCandidates/find-inactive': ['isAuthenticated', 'isAdmin'],
  'newCandidates/compareTopic/*': ['isAuthenticated', 'isAdmin'],
  'newCandidates/campaignUpdate/*': ['isAuthenticated', 'isAdmin'],
  'newCandidate/candidateUgc/*': ['isAuthenticated', 'isCandidate'],
  'newCandidate/candidateUgc/list': ['isAuthenticated', 'isAdmin'],
  'newCandidate/candidateUgc/accept': ['isAuthenticated', 'isAdmin'],
  // 'seed/*': ['isAuthenticated', 'isAdmin'],
  'role/*': ['isAuthenticated', 'isAdmin'],
  '*': ['isAuthenticated'], // Restrict all but routes below
  // public access
  'general/*': true,
  'entrance/*': true,
  'content/*': true,
  'notifications/*': true,
  'incumbent/*': true,
  'presidential/*': true,
  'candidates/*': true,
  'newCandidates/find': true,
  'newCandidates/find-with-inactive': true,
  'newCandidates/homepage-candidates': true,
  'newCandidates/list': true,
  'newCandidates/share-image': true,
  'newCandidates/share/create-guest': true,
  'seed/*': true,
  'subscribe/*': true,
  'user/support/list-by-candidate': true,
  'user/confirm/from-login': true,
  'newCandidates/compareTopic/list': true,
};
