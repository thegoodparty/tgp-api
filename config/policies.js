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
  'campaign/onboarding/delete': ['isAuthenticated', 'isAdmin'],
  'campaign/admin-delete': ['isAuthenticated', 'isAdmin'],
  'campaign/admin-update': ['isAuthenticated', 'isAdmin'],
  'campaign/onboarding/cancel-launch-request': ['isAuthenticated', 'isAdmin'],
  'campaign/onboarding/list': ['isAuthenticated', 'isAdmin'],
  'campaign/list': ['isAuthenticated', 'isAdmin'],
  'campaign/find-by-slug': ['isAuthenticated', 'isAdmin'],
  'topIssues/candidatePosition/*': ['isAuthenticated'],
  'topIssues/byLocation/find': ['isAuthenticated'],
  'ai/test': ['isAuthenticated', 'isAdmin'],
  'ai/load': ['isAuthenticated', 'isAdmin'],
  'voterData/*': ['isAuthenticated', 'isAdmin'],
  'voterData/get': ['isAuthenticated'],
  'voterData/path-to-victory': ['isAuthenticated'],
  '*': ['isAuthenticated'], // Restrict all but routes below
  // public access
  'general/*': true,
  'entrance/*': true,
  'content/*': true,
  'newCandidates/find': true,
  'candidate/find': true,
  'candidate/list': true,
  'newCandidates/list': true,
  'declare/list': true,
  'seed/*': true,
  'subscribe/*': true,
  'topIssues/topIssue/list': true,
  'topIssues/position/list': true,
  'topIssues/candidatePosition/find-by-candidate': true,
  'topIssues/candidatePosition/find-by-campaign': true,
  'visit/*': true,
  'newCandidates/application/upload-image': true, // for guest applications
  'user/notification/cron/*': true,
  'messaging/*': true,
  // 'campaign/deadlines/refresh': true, // uncomment to run on local.
  'campaign/deadlines/list': true,
  'campaign/ballotData/races': true,
  'campaign/l2Data/office': true, // for testing only.
  'race/*': true,
  'data-processing/*': true,
  'job/*': true,
  'jobs/*': true,
};
