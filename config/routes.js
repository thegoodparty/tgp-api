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
  'GET    /': 'general/health',
  'GET    /api/v1/homepage': 'general/homepage',
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
  'GET    /api/v1/entrance/verify-recaptcha': 'entrance/verify-recaptcha',
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
  'POST    /api/v1/notifications/guest-feedback':
    'notifications/feedback/create-guest',
  'POST    /api/v1/notifications/log-error': 'notifications/log-error',

  'PUT    /api/v1/user/update-user': 'user/update-user',
  'DELETE    /api/v1/user': 'user/delete',
  'PUT    /api/v1/user/update-address': 'user/update-address',
  // 'POST    /api/v1/user/avatar': 'user/upload-avatar',
  'POST    /api/v1/user/avatar': 'user/upload-image',
  'GET    /api/v1/user/crew': 'user/crew/find',
  'POST    /api/v1/user/crew': 'user/crew/create',
  'GET    /api/v1/user/leaderboard': 'user/leaderboard',
  'PUT   /api/v1/user/password': 'user/password/update',
  'POST   /api/v1/user/password': 'user/password/create',
  'PUT   /api/v1/user/token-refresh': 'user/token-refresh',
  'PUT   /api/v1/user/confirm': 'user/confirm/update',
  'PUT   /api/v1/user/confirm/login': 'user/confirm/from-login',
  'POST   /api/v1/user/confirm': 'user/confirm/resend',

  'POST   /api/v1/support': 'user/support/create',
  'DELETE   /api/v1/support': 'user/support/delete',
  'GET   /api/v1/supports': 'user/support/list-by-user',
  // 'GET   /api/v1/candidate-supports': 'user/support/list-by-candidate',

  'GET    /api/v1/admin/candidates': 'admin/candidate/list',
  'PUT    /api/v1/admin/candidate-user':
    'admin/candidate/associate-user/update',
  'GET    /api/v1/admin/candidate-user': 'admin/candidate/associate-user/find',
  'DELETE    /api/v1/admin/candidate-user':
    'admin/candidate/associate-user/delete',
  'GET    /api/v1/admin/users': 'admin/all-users',
  'DELETE    /api/v1/admin/user': 'admin/delete-user',
  'GET   /api/v1/admin/articles-feedback': 'admin/articles-feedback',
  'GET   /api/v1/admin/topics-feedback': 'admin/topics-feedback',
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

  'GET   /api/v1/user/staff': 'user/staff',

  'POST   /api/v1/visit': 'visit/create',

  // endorseButton
  'GET   /api/v1/button/impression': 'endorseButton/impression',
  'GET   /api/v1/button/click': 'endorseButton/click',

  // campaign
  'GET    /api/v1/campaign': 'campaign/find',
  'PUT    /api/v1/campaign': 'campaign/update',
  'GET    /api/v1/campaign/stats': 'campaign/stats',
  'POST   /api/v1/campaign/staff': 'campaign/staff/create',
  'PUT    /api/v1/campaign/staff': 'campaign/staff/update',
  'GET    /api/v1/campaign/staff-role': 'campaign/staff/find',
  'GET    /api/v1/campaign/staff': 'campaign/staff/list',
  'DELETE   /api/v1/campaign/staff': 'campaign/staff/delete',
  'DELETE   /api/v1/campaign/staff-invitation':
    'campaign/staff/delete-invitation',

  'POST   /api/v1/campaign/endorsement': 'campaign/endorsement/create',
  'GET    /api/v1/campaign/endorsements': 'campaign/endorsement/list',
  'DELETE    /api/v1/campaign/endorsement': 'campaign/endorsement/delete',
  'PUT    /api/v1/campaign/endorsement': 'campaign/endorsement/update',
  'POST   /api/v1/campaign/image': 'campaign/image/create',
  'PUT    /api/v1/campaign/preferences': 'campaign/preferences/update',
  'POST    /api/v1/campaign/pledge': 'campaign/claim/pledge',
  'POST    /api/v1/campaign/claim': 'campaign/claim/claim',
  'PUT   /api/v1/campaign/approve-claim': 'campaign/claim/approve-claim',

  'GET   /api/v1/top-issues': 'topIssues/topIssue/list',
  'POST   /api/v1/top-issue': 'topIssues/topIssue/create',
  'PUT   /api/v1/top-issue': 'topIssues/topIssue/update',
  'DELETE   /api/v1/top-issue': 'topIssues/topIssue/delete',

  // position
  'GET   /api/v1/positions': 'topIssues/position/list',
  'POST   /api/v1/position': 'topIssues/position/create',
  'PUT   /api/v1/position': 'topIssues/position/update',
  'DELETE   /api/v1/position': 'topIssues/position/delete',

  // candidatePositions
  'GET   /api/v1/candidate-positions': 'topIssues/candidatePosition/list',
  'POST   /api/v1/candidate-position': 'topIssues/candidatePosition/create',
  'PUT   /api/v1/candidate-position': 'topIssues/candidatePosition/update',
  'DELETE   /api/v1/candidate-position': 'topIssues/candidatePosition/delete',

  // application
  'POST   /api/v1/application': 'newCandidates/application/create',
  'DELETE   /api/v1/application': 'newCandidates/application/delete',
  'GET   /api/v1/applications': 'newCandidates/application/list',
  'GET   /api/v1/application': 'newCandidates/application/find',
  'PUT   /api/v1/application': 'newCandidates/application/update',
  'POST   /api/v1/application/submit': 'newCandidates/application/submit',
  'POST   /api/v1/application/upload-image':
    'newCandidates/application/upload-image',
  'GET   /api/v1/applications/in-review':
    'newCandidates/application/list-in-review', //admin
  'PUT   /api/v1/applications/approve': 'newCandidates/application/approve', //admin
  'PUT   /api/v1/applications/reject': 'newCandidates/application/reject', //admin

  // socialListening
  'GET   /api/v1/listening/followers-filler':
    'socialListening/followers-filler',
  'GET   /api/v1/listening/followers-count': 'socialListening/followers-count',
  'GET   /api/v1/listening/tiktok-scrape': 'socialListening/tiktok-scrape',
  'GET   /api/v1/listening/search-results': 'socialListening/search-results',

  // socialListening crons
  'GET   /api/v1/listening/cron/searches': 'socialListening/cron/searches',
  'GET   /api/v1/listening/cron/followers': 'socialListening/cron/followers',
  'GET   /api/v1/listening/cron/brands': 'socialListening/cron/brands',
  'GET   /api/v1/listening/cron/candidates-tiktok-scrape':
    'socialListening/cron/candidates-tiktok-scrape',
  'GET   /api/v1/listening/cron/update-candidates-feed':
    'socialListening/cron/update-candidates-feed',
};
