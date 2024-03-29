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
  'POST   /api/v1/log-error': 'general/error-logger',
  'GET    /api/v1/seed': 'seed/seed',
  'GET    /api/v1/ballot-ready': 'seed/ballot-ready',
  'GET    /api/v1/seed/counties': 'seed/counties',
  'GET    /api/v1/seed/municipalities': 'seed/municipalities',
  'GET    /api/v1/seed/locations': 'seed/locations',
  'GET    /api/v1/seed/split': 'seed/split-large-csv',
  'GET    /api/v1/seed/reduce': 'seed/reduce-large-csv',
  'GET    /api/v1/seed/races': 'seed/races',
  'GET    /api/v1/content/content-by-key': 'content/content-by-key',
  'GET    /api/v1/content/update': 'content/update',
  'GET    /api/v1/content/blog-articles-titles': 'content/blog-articles-titles',
  'GET    /api/v1/content/blog-articles-by-section':
    'content/blog-articles-by-section',
  'GET    /api/v1/content/blog-articles-by-tag': 'content/blog-articles-by-tag',

  'PUT    /api/v1/entrance/login': 'entrance/login',
  'PUT    /api/v1/entrance/social-login': 'entrance/social-login',
  // 'GET    /api/v1/entrance/verify-recaptcha': 'entrance/verify-recaptcha',
  'PUT    /api/v1/entrance/twitter-login': 'entrance/twitter-login',
  'PUT    /api/v1/entrance/twitter-confirm': 'entrance/twitter-confirm',
  'POST   /api/v1/entrance/register': 'entrance/register',
  'POST   /api/v1/entrance/send-password-recovery-email':
    'entrance/send-password-recovery-email',
  'PUT   /api/v1/entrance/reset-password': 'entrance/reset-password',

  'PUT    /api/v1/user/update-user': 'user/update-user',
  'PUT    /api/v1/user/refresh': 'user/refresh',
  'DELETE    /api/v1/user': 'user/delete',
  // 'POST    /api/v1/user/avatar': 'user/upload-avatar',
  'POST    /api/v1/user/avatar': 'user/upload-image',
  'PUT   /api/v1/user/password': 'user/password/update',
  'GET   /api/v1/user/campaign-status': 'user/campaign-status',
  'POST   /api/v1/upload-base64-image': 'user/upload-base64-image',

  'GET    /api/v1/admin/candidates': 'admin/candidate/list',
  'GET    /api/v1/admin/hidden-candidates': 'admin/candidate/hidden-list',
  'GET    /api/v1/admin/users': 'admin/all-users',
  'DELETE    /api/v1/admin/user': 'admin/delete-user',
  'POST   /api/v1/admin/user/impersonate': 'admin/impersonate-user',
  'POST   /api/v1/admin/uploaded-images': 'admin/uploaded-images',
  'POST   /api/v1/admin/upload-image': 'admin/upload-image',
  // for campaign
  'POST    /api/v1/admin/victory-mail': 'admin/victory-mail',
  'PUT    /api/v1/admin/candidate/reactivate': 'admin/candidate/reactivate',
  'PUT    /api/v1/admin/deactivate-candidate-by-campaign':
    'admin/candidate/deactivate-candidate-by-campaign',
  'POST   /api/v1/admin/candidate-enhance': 'admin/candidate-enhance',

  // New Candidates
  // 'POST   /api/v1/new-candidate': 'newCandidates/create',
  // 'GET    /api/v1/new-candidate': 'newCandidates/find',
  // 'PUT    /api/v1/new-candidate': 'newCandidates/update',

  // 'GET    /api/v1/new-candidates': 'newCandidates/list',
  // 'DELETE    /api/v1/new-candidate': 'newCandidates/delete',
  // 'GET    /api/v1/new-candidate/can-edit': 'newCandidates/can-edit',

  'GET   /api/v1/subscribe/email': 'subscribe/subscribe-email',

  'POST   /api/v1/visit': 'visit/create',

  // candidate from campaigns
  'GET    /api/v1/candidate': 'candidate/find',
  'PUT    /api/v1/candidate': 'candidate/update',
  'GET    /api/v1/candidates': 'candidate/list',
  'GET    /api/v1/candidate/can-edit': 'candidate/can-edit',

  // campaign

  'GET    /api/v1/campaign/deadlines/refresh': 'campaign/deadlines/refresh',
  'GET    /api/v1/campaign/deadlines': 'campaign/deadlines/list',

  'POST   /api/v1/campaign/endorsement': 'campaign/endorsement/create',
  'GET    /api/v1/campaign/endorsements': 'campaign/endorsement/list',
  'DELETE    /api/v1/campaign/endorsement': 'campaign/endorsement/delete',
  'PUT    /api/v1/campaign/endorsement': 'campaign/endorsement/update',

  // volunteerInvitation

  'POST   /api/v1/campaign/volunteer/invitation':
    'campaign/volunteer/invitation/create',
  'GET   /api/v1/campaign/volunteer/invitations':
    'campaign/volunteer/invitation/list',
  'GET   /api/v1/campaign/volunteer/invitations-by-user':
    'campaign/volunteer/invitation/list-by-user',
  'DELETE   /api/v1/campaign/volunteer/invitation':
    'campaign/volunteer/invitation/delete',
  'PUT   /api/v1/campaign/volunteer/invitation/accept':
    'campaign/volunteer/invitation/accept',

  // campaignVolunteer
  'GET   /api/v1/campaign/volunteers': 'campaign/volunteer/list',
  'GET   /api/v1/campaign/volunteer-by-user': 'campaign/volunteer/list-by-user',
  'POST   /api/v1/campaign/volunteer': 'campaign/volunteer/create',

  // campaignUpdateHistory

  'POST   /api/v1/campaign/update-history':
    'campaign/campaignUpdateHistory/create',
  'GET   /api/v1/campaign/update-histories':
    'campaign/campaignUpdateHistory/list',
  'DELETE   /api/v1/campaign/update-history':
    'campaign/campaignUpdateHistory/delete',

  // onboarding

  'DELETE   /api/v1/campaign/onboarding': 'campaign/onboarding/delete',
  'DELETE   /api/v1/campaign': 'campaign/onboarding/admin-delete',
  'PUT   /api/v1/campaign-admin': 'campaign/onboarding/admin-update',
  'POST   /api/v1/campaign/onboarding': 'campaign/onboarding/create',
  'PUT   /api/v1/campaign/onboarding': 'campaign/onboarding/update',
  'GET   /api/v1/campaign/onboarding/by-user':
    'campaign/onboarding/find-by-user',
  'GET   /api/v1/campaign/onboarding/by-slug':
    'campaign/onboarding/find-by-slug', //admin
  'GET   /api/v1/campaign/onboardings': 'campaign/onboarding/list',
  'POST   /api/v1/campaign/onboarding/launch-request':
    'campaign/onboarding/launch-request',
  'DELETE   /api/v1/campaign/onboarding/launch-request':
    'campaign/onboarding/cancel-launch-request',
  'POST   /api/v1/campaign/onboarding/launch': 'campaign/onboarding/launch',

  // onboarding AI
  'POST   /api/v1/campaign/onboarding/ai': 'campaign/onboarding/ai/create',
  'PUT   /api/v1/campaign/onboarding/ai': 'campaign/onboarding/ai/edit',
  'POST   /api/v1/campaign/onboarding/ai/rename':
    'campaign/onboarding/ai/rename',
  'DELETE   /api/v1/campaign/onboarding/ai': 'campaign/onboarding/ai/delete',

  'POST   /api/v1/campaign/onboarding/fast-ai':
    'campaign/onboarding/ai/create-no-queue',
  'GET   /api/v1/campaign/onboarding/planVersion':
    'campaign/onboarding/planVersion/find',

  'GET   /api/v1/top-issues': 'topIssues/topIssue/list',
  'POST   /api/v1/top-issue': 'topIssues/topIssue/create',
  'PUT   /api/v1/top-issue': 'topIssues/topIssue/update',
  'DELETE   /api/v1/top-issue': 'topIssues/topIssue/delete',
  'GET   /api/v1/top-issue/by-location': 'topIssues/byLocation/find',

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
  'GET  /api/v1/candidate-position':
    'topIssues/candidatePosition/find-by-candidate',
  'GET  /api/v1/campaign-position':
    'topIssues/candidatePosition/find-by-campaign',

  // application

  'POST   /api/v1/application/upload-image':
    'newCandidates/application/upload-image',

  'GET   /api/v1/declares': 'declare/list',

  // notifications
  'GET   /api/v1/notifications': 'user/notification/list',
  'PUT   /api/v1/notification': 'user/notification/update',
  'PUT   /api/v1/notification-preferences':
    'user/notification/update-preferences',

  //notification crons
  'GET   /api/v1/notification/cron/weekly-goals':
    'user/notification/cron/weekly-goals',
  'GET   /api/v1/notification/cron/create-content':
    'user/notification/cron/create-content',
  'GET   /api/v1/notification/cron/update-tracker':
    'user/notification/cron/update-tracker',

  // messaging webhook
  'POST   /api/v1/twilio-webhook': 'messaging/twilio-webhook',

  // ballotData
  'GET   /api/v1/ballot-data/races': 'campaign/ballotData/races',

  // voterData l2Data
  'GET   /api/v1/voter-data/office': 'voterData/office',
  'POST  /api/v1/voter-data/path-to-victory': 'voterData/path-to-victory',
  'POST  /api/v1/voter-data/voter-file': 'voterData/voterFile/create',
  'GET  /api/v1/voter-data/voter-file': 'voterData/voterFile/get',

  // test ai
  'POST   /api/v1/ai/test': 'ai/test',
  'GET   /api/v1/ai/load': 'ai/load',

  // races
  'GET   /api/v1/race/by-state': 'race/by-state',
  'GET   /api/v1/race/all-state': 'race/all-state',
  'GET   /api/v1/race/by-county': 'race/by-county',
  'GET   /api/v1/race/by-city': 'race/by-city',
  'GET   /api/v1/race/proximity-cities': 'race/proximity-cities',
  'GET   /api/v1/race': 'race/get',
  'GET   /api/v1/race/csv': 'race/races-csv',

  'GET   /api/v1/ballotready-s3': 'data-processing/ballot-s3',
  'GET   /api/v1/techspeed-enhance': 'data-processing/techspeed-enhance',

  // jobs
  'GET   /api/v1/jobs': 'jobs/list',
  'GET   /api/v1/job': 'jobs/get',

  // doorKnocking
  'POST   /api/v1/campaign/door-knocking': 'campaign/doorKnocking/create',
  'GET   /api/v1/campaign/door-knockings': 'campaign/doorKnocking/list',
  'GET   /api/v1/campaign/door-knocking': 'campaign/doorKnocking/get',
  'DELETE   /api/v1/campaign/door-knocking': 'campaign/doorKnocking/delete',

  'GET   /api/v1/campaign/door-knocking/route':
    'campaign/doorKnocking/route/get',

  // volunteer routes
  'GET   /api/v1/campaign/volunteer/routes': 'campaign/volunteer/route/list',
  'GET   /api/v1/campaign/volunteer/route': 'campaign/volunteer/route/get',
  'PUT   /api/v1/campaign/volunteer/route/claim':
    'campaign/volunteer/route/claim',
  'PUT   /api/v1/campaign/volunteer/route/unclaim':
    'campaign/volunteer/route/unclaim',

  //voter data - volunteer
  'GET  /api/v1/voter': 'voterData/get',
};
