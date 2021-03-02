/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {
  //  ╔═╗╔═╗╦  ╔═╗╔╗╔╔╦╗╔═╗╔═╗╦╔╗╔╔╦╗╔═╗
  //  ╠═╣╠═╝║  ║╣ ║║║ ║║╠═╝║ ║║║║║ ║ ╚═╗
  //  ╩ ╩╩  ╩  ╚═╝╝╚╝═╩╝╩  ╚═╝╩╝╚╝ ╩ ╚═╝

  'GET    /api/v1/content/all-content': 'content/all-content',
  'GET    /api/v1/content/update': 'content/update',
  'POST    /api/v1/content/article-feedback': 'content/article-feedback',

  'PUT    /api/v1/entrance/login': 'entrance/login',
  'PUT    /api/v1/entrance/social-login': 'entrance/social-login',
  'PUT    /api/v1/entrance/twitter-login': 'entrance/twitter-login',
  'PUT    /api/v1/entrance/twitter-confirm': 'entrance/twitter-confirm',
  'POST   /api/v1/entrance/register': 'entrance/register',
  'GET   /api/v1/entrance/resend-verify-email': 'entrance/resend-verify-email',
  'GET    /api/v1/entrance/zip-to-district': 'entrance/zip-to-district',
  'GET    /api/v1/entrance/address-to-district': 'entrance/address-to-district',
  'PUT    /api/v1/entrance/confirm-email': 'entrance/confirm-email',
  'POST   /api/v1/entrance/send-password-recovery-email':
    'entrance/send-password-recovery-email',

  'PUT   /api/v1/entrance/reset-password': 'entrance/reset-password',

  'POST    /api/v1/notifications/email-ama': 'notifications/email-ama',
  'POST    /api/v1/notifications/log-error': 'notifications/log-error',

  'POST   /api/v1/role/create': 'role/create',

  'PUT    /api/v1/user/update-user': 'user/update-user',
  'PUT    /api/v1/user/update-user-ranking': 'user/update-user-ranking',
  'PUT    /api/v1/user/delete-user-ranking': 'user/ranking/delete-user-ranking',
  'PUT    /api/v1/user/update-address': 'user/update-address',
  'PUT    /api/v1/user/upload-avatar': 'user/upload-avatar',
  'GET    /api/v1/user/crew': 'user/crew',
  'GET    /api/v1/user/leaderboard': 'user/leaderboard',
  'POST   /api/v1/user/rank-candidate': 'user/ranking/rank-candidate',
  'DELETE /api/v1/user/rank-candidate': 'user/ranking/delete-rank-candidate',
  'GET   /api/v1/user/ranking': 'user/ranking/user-ranking',
  'PUT   /api/v1/user/change-password': 'user/change-password',
  'POST   /api/v1/user/add-password': 'user/add-password',
  'PUT   /api/v1/user/token-refresh': 'user/token-refresh',

  'GET    /api/v1/admin/candidates': 'admin/candidates',
  'PUT    /api/v1/admin/candidate': 'admin/update-candidate',
  'DELETE    /api/v1/admin/candidate-update': 'admin/delete-candidate-update',
  'GET    /api/v1/admin/users': 'admin/all-users',
  'DELETE    /api/v1/admin/users': 'admin/delete-user',
  'GET   /api/v1/admin/articles-feedback': 'admin/articles-feedback',
  'PUT   /api/v1/admin/candidate-image': 'admin/update-candidate-image',
  'GET   /api/v1/admin/voterize': 'admin/all-voterize',
  'PUT   /api/v1/admin/voterize': 'admin/update-voterize',
  'POST   /api/v1/admin/uploaded-images': 'admin/uploaded-images',
  'POST   /api/v1/admin/upload-image': 'admin/upload-image',

  'GET    /api/v1/seed/seed': 'seed/seed',
  'POST    /api/v1/seed/seed-election-dates': 'seed/seed-election-dates',
  'GET    /api/v1/seed/seed-incumbents': 'seed/seed-incumbents',
  'GET    /api/v1/seed/seed-presidential': 'seed/seed-presidential',
  'GET    /api/v1/seed/seed-presidential-add1': 'seed/seed-presidential-add1',
  'GET    /api/v1/seed/seed-presidential-source':
    'seed/seed-presidential-source',
  'GET    /api/v1/seed/seed-races-combined': 'seed/seed-races-combined',
  'GET    /api/v1/seed/seed-ballotpedia': 'seed/seed-ballotpedia',
  'GET    /api/v1/seed/seed-howie-total': 'seed/seed-howie-total',
  'GET    /api/v1/seed/seed-ballotpedia-manual-match':
    'seed/seed-ballotpedia-manual-match',
  'GET    /api/v1/seed/seed-twitter-followers': 'seed/seed-twitter-followers',
  'GET    /api/v1/seed/seed-ballotpedia-cand-profile':
    'seed/seed-ballotpedia-cand-profile',
  'GET    /api/v1/seed/seed-likely-voters-house':
    'seed/seed-likely-voters-house',
  'GET    /api/v1/seed/seed-likely-voters-senate':
    'seed/seed-likely-voters-senate',
  'GET    /api/v1/seed/temp-task': 'seed/temp-task',

  'GET    /api/v1/incumbent/find-by-district': 'incumbent/find-by-district',
  'GET    /api/v1/incumbent/to-scrape': 'incumbent/to-scrape',
  'GET    /api/v1/incumbents': 'incumbent/all',

  'GET    /api/v1/race-candidate/house-by-district':
    'race-candidate/house-by-district',
  'GET    /api/v1/race-candidate/senate-by-state':
    'race-candidate/senate-by-state',
  'GET    /api/v1/race-candidate/all': 'race-candidate/all',
  'GET    /api/v1/race-candidate/good-challengers':
    'race-candidate/good-challengers',

  'GET    /api/v1/presidential/all': 'presidential/all',

  'GET    /api/v1/candidates/find': 'candidates/find',
  'GET    /api/v1/candidates/find-by-bloc': 'candidates/find-by-bloc',
  'GET    /api/v1/candidates/all': 'candidates/all',
  'POST   /api/v1/candidates/track-share': 'candidates/track-share',
  'POST    /api/v1/candidates/share-image': 'candidates/share-image',

  // New Candidates
  'POST   /api/v1/new-candidate': 'newCandidates/create',
  'GET    /api/v1/new-candidate': 'newCandidates/find',
  'PUT    /api/v1/new-candidate': 'newCandidates/update',
  'GET    /api/v1/homepage-candidates': 'newCandidates/homepage-candidates',
  'GET    /api/v1/new-candidates': 'newCandidates/list',
  'DELETE    /api/v1/new-candidate': 'newCandidates/delete',

  'GET    /api/v1/counts/user-counts': 'counts/user-counts',

  'POST   /api/v1/scrape/scrape-webhook': 'scrape/scrape-webhook',
  'GET   /api/v1/subscribe/email': 'subscribe/subscribe-email',

  'GET   /api/v1/voterize/verify-vote': 'voterize/verify-vote',
  'GET   /api/v1/voterize/register-vote': 'voterize/register-vote',

  'POST   /api/v1/support': 'user/support/create',
  'DELETE   /api/v1/support': 'user/support/delete',
  'DELETE   /api/v1/admin-support': 'user/support/admin-delete',
  'PUT   /api/v1/support': 'user/support/update',
  'GET   /api/v1/supports': 'user/support/list-by-user',
  'GET   /api/v1/candidate-supports': 'user/support/list-by-candidate',
};
