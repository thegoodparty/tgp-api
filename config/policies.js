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
  'topIssues/*': ['isAuthenticated', 'isAdmin'],
  'topIssues/candidatePosition/*': ['isAuthenticated'],
  'newCandidates/campaignUpdate/*': ['isAuthenticated', 'isAdmin'],
  'campaign/ugc/list': ['isAuthenticated', 'isAdmin'],
  'campaign/ugc/accept': ['isAuthenticated', 'isAdmin'],
  'campaign/ugc/reject': ['isAuthenticated', 'isAdmin'],
  'newCandidates/campaignUpdate/approve': ['isAuthenticated', 'isAdmin'],
  'newCandidates/application/list-in-review': ['isAuthenticated', 'isAdmin'],
  'newCandidates/application/approve': ['isAuthenticated', 'isAdmin'],
  'newCandidates/application/reject': ['isAuthenticated', 'isAdmin'],
  'notifications/feedback/create': ['isAuthenticated'],
  '*': ['isAuthenticated'], // Restrict all but routes below
  // public access
  'campaign/notification/schedule': true,
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
  'topIssues/topIssue/list': true,
  'topIssues/position/list': true,
  'visit/*': true,
  'endorseButton/*': true,
  'updates/create': true,
  'newCandidates/application/upload-image': true, // for guest applications
  'notifications/feedback/create-guest': true,
};
