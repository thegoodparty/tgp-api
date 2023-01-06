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
  // 'GET    /api/v1/seed': 'seed/seed',
  'GET    /api/v1/content/all-content': 'content/all-content', // keep
  'GET    /api/v1/content/content-by-key': 'content/content-by-key', // keep
  'GET    /api/v1/content/update': 'content/update', // keep

  'PUT    /api/v1/entrance/login': 'entrance/login', // keep
  'PUT    /api/v1/entrance/social-login': 'entrance/social-login', // keep
  // 'GET    /api/v1/entrance/verify-recaptcha': 'entrance/verify-recaptcha',
  'PUT    /api/v1/entrance/twitter-login': 'entrance/twitter-login', // keep
  'PUT    /api/v1/entrance/twitter-confirm': 'entrance/twitter-confirm', // keep
  'POST   /api/v1/entrance/register': 'entrance/register', // keep
  'POST   /api/v1/entrance/send-password-recovery-email':
    'entrance/send-password-recovery-email', // keep
  'PUT   /api/v1/entrance/reset-password': 'entrance/reset-password', // keep

  'PUT    /api/v1/user/update-user': 'user/update-user', // keep
  'DELETE    /api/v1/user': 'user/delete', // keep
  // 'POST    /api/v1/user/avatar': 'user/upload-avatar',
  'POST    /api/v1/user/avatar': 'user/upload-image', // keep
  'PUT   /api/v1/user/password': 'user/password/update', // keep

  'POST   /api/v1/support': 'user/support/create', // keep
  'DELETE   /api/v1/support': 'user/support/delete', // keep
  'GET   /api/v1/supports': 'user/support/list-by-user', // keep
  // 'GET   /api/v1/candidate-supports': 'user/support/list-by-candidate',

  'GET    /api/v1/admin/candidates': 'admin/candidate/list', // keep
  'GET    /api/v1/admin/users': 'admin/all-users', // keep
  'DELETE    /api/v1/admin/user': 'admin/delete-user', // keep
  'POST   /api/v1/admin/uploaded-images': 'admin/uploaded-images', // keep
  'POST   /api/v1/admin/upload-image': 'admin/upload-image', // keep

  // New Candidates
  'POST   /api/v1/new-candidate': 'newCandidates/create', // keep
  'GET    /api/v1/new-candidate': 'newCandidates/find', // keep

  'GET    /api/v1/homepage-candidates': 'newCandidates/homepage-candidates', // keep
  'GET    /api/v1/new-candidates': 'newCandidates/list', // keep
  'DELETE    /api/v1/new-candidate': 'newCandidates/delete', // keep

  'GET   /api/v1/subscribe/email': 'subscribe/subscribe-email', // keep

  'GET   /api/v1/user/staff': 'user/staff', // keep

  'POST   /api/v1/visit': 'visit/create', // keep

  // campaign
  'GET    /api/v1/campaign': 'campaign/find', // keep
  'PUT    /api/v1/campaign': 'campaign/update', // keep
  'GET    /api/v1/campaign/stats': 'campaign/stats', // keep

  'GET    /api/v1/campaign/staff-role': 'campaign/staff/find', // keep

  'POST   /api/v1/campaign/endorsement': 'campaign/endorsement/create', // keep
  'GET    /api/v1/campaign/endorsements': 'campaign/endorsement/list', // keep
  'DELETE    /api/v1/campaign/endorsement': 'campaign/endorsement/delete', // keep
  'PUT    /api/v1/campaign/endorsement': 'campaign/endorsement/update', // keep
  'POST   /api/v1/campaign/image': 'campaign/image/create', // keep
  'POST    /api/v1/campaign/claim': 'campaign/claim/claim', // keep
  'PUT   /api/v1/campaign/approve-claim': 'campaign/claim/approve-claim', // keep

  'GET   /api/v1/top-issues': 'topIssues/topIssue/list', // keep
  'POST   /api/v1/top-issue': 'topIssues/topIssue/create', // keep
  'PUT   /api/v1/top-issue': 'topIssues/topIssue/update', // keep
  'DELETE   /api/v1/top-issue': 'topIssues/topIssue/delete', // keep

  // position
  'GET   /api/v1/positions': 'topIssues/position/list', // keep
  'POST   /api/v1/position': 'topIssues/position/create', // keep
  'PUT   /api/v1/position': 'topIssues/position/update', // keep
  'DELETE   /api/v1/position': 'topIssues/position/delete', // keep

  // candidatePositions
  'GET   /api/v1/candidate-positions': 'topIssues/candidatePosition/list', // keep
  'POST   /api/v1/candidate-position': 'topIssues/candidatePosition/create', // keep
  'PUT   /api/v1/candidate-position': 'topIssues/candidatePosition/update', // keep
  'DELETE   /api/v1/candidate-position': 'topIssues/candidatePosition/delete', // keep

  // application

  'POST   /api/v1/application/upload-image':
    'newCandidates/application/upload-image', // keep

  // socialListening

  'GET   /api/v1/listening/followers-count': 'socialListening/followers-count', // keep
  // 'GET   /api/v1/listening/tiktok-scrape': 'socialListening/tiktok-scrape',
  // 'GET   /api/v1/listening/search-results': 'socialListening/search-results',

  // socialListening crons
  'GET   /api/v1/listening/cron/searches': 'socialListening/cron/searches',
  'GET   /api/v1/listening/cron/followers': 'socialListening/cron/followers',
  'GET   /api/v1/listening/cron/brands': 'socialListening/cron/brands',
  'GET   /api/v1/listening/cron/candidates-tiktok-scrape':
    'socialListening/cron/candidates-tiktok-scrape',
  'GET   /api/v1/listening/cron/update-candidates-feed':
    'socialListening/cron/update-candidates-feed',
};
