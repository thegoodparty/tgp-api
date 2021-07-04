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
  'GET   /': 'general/health',
  'GET    /api/v1/seed': 'seed/seed',
  'GET    /api/v1/content/all-content': 'content/all-content',
  'GET    /api/v1/content/landing-page': 'content/landing-page-content',
  'GET    /api/v1/content/content-by-key': 'content/content-by-key',
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
  'PUT    /api/v1/user/update-address': 'user/update-address',
  'POST    /api/v1/user/avatar': 'user/upload-avatar',
  'GET    /api/v1/user/crew': 'user/crew',
  'GET    /api/v1/user/leaderboard': 'user/leaderboard',
  'PUT   /api/v1/user/change-password': 'user/change-password',
  'POST   /api/v1/user/add-password': 'user/add-password',
  'PUT   /api/v1/user/token-refresh': 'user/token-refresh',

  'GET    /api/v1/admin/candidates': 'admin/candidates',
  'PUT    /api/v1/admin/candidate': 'admin/update-candidate',
  'DELETE    /api/v1/admin/candidate-update': 'admin/delete-candidate-update',
  'GET    /api/v1/admin/users': 'admin/all-users',
  'DELETE    /api/v1/admin/users': 'admin/delete-user',
  'GET   /api/v1/admin/articles-feedback': 'admin/articles-feedback',
  'GET   /api/v1/admin/voterize': 'admin/all-voterize',
  'PUT   /api/v1/admin/voterize': 'admin/update-voterize',
  'POST   /api/v1/admin/uploaded-images': 'admin/uploaded-images',
  'POST   /api/v1/admin/upload-image': 'admin/upload-image',

  'GET    /api/v1/candidates/find': 'candidates/find',

  // New Candidates
  'POST   /api/v1/new-candidate': 'newCandidates/create',
  'GET    /api/v1/new-candidate': 'newCandidates/find',
  'GET    /api/v1/new-candidate-inactive': 'newCandidates/find-inactive',
  'GET    /api/v1/new-candidate-with-inactive':
    'newCandidates/find-with-inactive',
  'PUT    /api/v1/new-candidate': 'newCandidates/update',
  'GET    /api/v1/homepage-candidates': 'newCandidates/homepage-candidates',
  'GET    /api/v1/new-candidates': 'newCandidates/list',
  'DELETE    /api/v1/new-candidate': 'newCandidates/delete',
  'POST    /api/v1/new-candidate/share-image': 'newCandidates/share-image',
  'POST   /api/v1/new-candidate/share': 'newCandidates/share/create',
  'POST   /api/v1/new-candidate/share-guest':
    'newCandidates/share/create-guest',
  'PUT    /api/v1/new-candidate/image': 'newCandidates/image/update',
  'PUT    /api/v1/new-candidate/compared': 'newCandidates/compared/update',

  'GET   /api/v1/subscribe/email': 'subscribe/subscribe-email',

  'GET   /api/v1/voterize/verify-vote': 'voterize/verify-vote',
  'GET   /api/v1/voterize/register-vote': 'voterize/register-vote',

  'POST   /api/v1/support': 'user/support/create',
  'DELETE   /api/v1/support': 'user/support/delete',
  'DELETE   /api/v1/admin-support': 'user/support/admin-delete',
  'PUT   /api/v1/support': 'user/support/update',
  'GET   /api/v1/supports': 'user/support/list-by-user',
  'GET   /api/v1/candidate-supports': 'user/support/list-by-candidate',

  'GET   /api/v1/compare-topics': 'newCandidates/compareTopic/list',
  'POST   /api/v1/compare-topic': 'newCandidates/compareTopic/create',
  'PUT   /api/v1/compare-topic': 'newCandidates/compareTopic/update',
  'DELETE   /api/v1/compare-topic': 'newCandidates/compareTopic/delete',
};
