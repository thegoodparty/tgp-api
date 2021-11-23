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
  'POST    /api/v1/content/topic-feedback': 'content/topic-feedback',

  'PUT    /api/v1/entrance/login-step1': 'entrance/login-step1',
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
  'POST    /api/v1/notifications/feedback': 'notifications/feedback/create',
  'POST    /api/v1/notifications/log-error': 'notifications/log-error',

  'PUT    /api/v1/user/update-user': 'user/update-user',
  'PUT    /api/v1/user/update-address': 'user/update-address',
  'POST    /api/v1/user/avatar': 'user/upload-avatar',
  'GET    /api/v1/user/crew': 'user/crew/find',
  'POST    /api/v1/user/crew': 'user/crew/create',
  'GET    /api/v1/user/leaderboard': 'user/leaderboard',
  'PUT   /api/v1/user/password': 'user/password/update',
  'POST   /api/v1/user/password': 'user/password/create',
  'PUT   /api/v1/user/token-refresh': 'user/token-refresh',
  'PUT   /api/v1/user/confirm': 'user/confirm/update',
  'PUT   /api/v1/user/confirm/login': 'user/confirm/from-login',
  'POST   /api/v1/user/confirm': 'user/confirm/resend',

  'GET    /api/v1/admin/candidates': 'admin/candidate/list',
  'PUT    /api/v1/admin/candidate-user':
    'admin/candidate/associate-user/update',
  'GET    /api/v1/admin/candidate-user': 'admin/candidate/associate-user/find',
  'DELETE    /api/v1/admin/candidate-user':
    'admin/candidate/associate-user/delete',
  'DELETE    /api/v1/admin/candidate-update': 'admin/delete-candidate-update',
  'GET    /api/v1/admin/users': 'admin/all-users',
  'DELETE    /api/v1/admin/user': 'admin/delete-user',
  'GET   /api/v1/admin/articles-feedback': 'admin/articles-feedback',
  'GET   /api/v1/admin/topics-feedback': 'admin/topics-feedback',
  'GET   /api/v1/admin/voterize': 'admin/all-voterize',
  'PUT   /api/v1/admin/voterize': 'admin/update-voterize',
  'POST   /api/v1/admin/uploaded-images': 'admin/uploaded-images',
  'POST   /api/v1/admin/upload-image': 'admin/upload-image',
  'PUT   /api/v1/admin/log-as-candidate': 'admin/candidate/log-as-candidate',

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

  'POST    /api/v1/new-candidate/campaign-update':
    'newCandidates/campaignUpdate/create',
  'PUT    /api/v1/new-candidate/campaign-update':
    'newCandidates/campaignUpdate/update',
  'DELETE    /api/v1/new-candidate/campaign-update':
    'newCandidates/campaignUpdate/delete',
  'PUT    /api/v1/new-candidate/approve-update':
    'newCandidates/campaignUpdate/approve',

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

  'GET   /api/v1/candidate-user': 'candidateUser/find',
  'GET   /api/v1/candidate-user/stats': 'candidateUser/stats',
  'POST   /api/v1/candidate-user/update-request':
    'candidateUser/updateRequest/create',

  'POST   /api/v1/visit': 'visit/create',

  // candidate UGC
  'GET   /api/v1/candidate-ugcs': 'newCandidates/candidateUgc/list', //admin
  'PUT   /api/v1/candidate-ugcs/accept': 'newCandidates/candidateUgc/accept', //admin
  'PUT   /api/v1/candidate-ugcs/reject': 'newCandidates/candidateUgc/reject', //admin
  'GET   /api/v1/candidate-ugc': 'newCandidates/candidateUgc/find',
  'PUT   /api/v1/candidate-ugc': 'newCandidates/candidateUgc/update',

  // issue topic
  'GET   /api/v1/issue-topics': 'newCandidates/issueTopic/list',
  'POST   /api/v1/issue-topic': 'newCandidates/issueTopic/create',
  'PUT   /api/v1/issue-topic': 'newCandidates/issueTopic/update',
  'DELETE   /api/v1/issue-topic': 'newCandidates/issueTopic/delete',

  // candidate issue
  'GET   /api/v1/candidate-issue/pending': 'newCandidates/candidateIssue/list', //admin
  'PUT   /api/v1/candidate-issue/accept': 'newCandidates/candidateIssue/accept', //admin
  'PUT   /api/v1/candidate-issue/reject': 'newCandidates/candidateIssue/reject', //admin
  'GET   /api/v1/candidate-issue': 'newCandidates/candidateIssue/find',
  'PUT   /api/v1/candidate-issue': 'newCandidates/candidateIssue/update',

  // release
  'GET   /api/v1/releases': 'release/list',
  'POST   /api/v1/release': 'release/create',
  'PUT   /api/v1/release': 'release/update',
  'DELETE   /api/v1/release': 'release/delete',

  // updates(for notifications)
  'POST   /api/v1/updates': 'updates/create',
};
