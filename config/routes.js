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
  'GET    /api/v1/seed/campaigns': 'seed/campaigns',
  'GET    /api/v1/seed/counties': 'seed/counties',
  'GET    /api/v1/seed/municipalities': 'seed/municipalities',
  'GET    /api/v1/seed/locations': 'seed/locations',
  'GET    /api/v1/seed/split': 'seed/split-large-csv',
  'GET    /api/v1/seed/reduce': 'seed/reduce-large-csv',
  'GET    /api/v1/seed/races': 'seed/races',
  'GET    /api/v1/seed/election-types': 'seed/election-types',
  'GET    /api/v1/seed/position-election-dates': 'seed/position-election-dates',
  'GET    /api/v1/seed/candidate-victory': 'seed/candidate-victory',
  'GET    /api/v1/seed/campaign-victory': 'seed/campaign-victory',
  'GET    /api/v1/seed/mtfcc-seed': 'seed/mtfcc-seed',
  'GET    /api/v1/seed/fix-campaigns-no-users': 'seed/fix-campaigns-no-users',
  'GET    /api/v1/seed/fix-turnout': 'seed/fix-turnout',
  'GET    /api/v1/seed/tiers': 'seed/tiers',
  'GET    /api/v1/seed/sync-fullstory': 'seed/sync-fullstory',
  'GET    /api/v1/content/content-by-key': 'content/content-by-key',
  'GET    /api/v1/content/update': 'content/update',
  'GET    /api/v1/content/blog-articles-titles': 'content/blog-articles-titles',
  'GET    /api/v1/content/blog-articles-by-section':
    'content/blog-articles-by-section',
  'GET    /api/v1/content/blog-articles-by-tag': 'content/blog-articles-by-tag',
  'GET    /api/v1/content/article-tags': 'content/article-tags',
  'GET    /api/v1/content/blog-articles-by-slug':
    'content/blog-articles-by-slug',

  'PUT    /api/v1/entrance/login': 'entrance/login',
  'PUT    /api/v1/entrance/social-login': 'entrance/social-login',
  // 'GET    /api/v1/entrance/verify-recaptcha': 'entrance/verify-recaptcha',
  'PUT    /api/v1/entrance/twitter-login': 'entrance/twitter-login',
  'PUT    /api/v1/entrance/twitter-confirm': 'entrance/twitter-confirm',
  'POST   /api/v1/entrance/register': 'entrance/register',
  'POST   /api/v1/entrance/send-password-recovery-email':
    'entrance/send-password-recovery-email',
  'PUT   /api/v1/entrance/reset-password': 'entrance/reset-password',

  'PUT    /api/v1/user': 'user/update',
  'PUT    /api/v1/user/meta': 'user/metadata/update',
  'GET    /api/v1/user/meta': 'user/metadata/get',
  'PUT    /api/v1/user/refresh': 'user/refresh',
  'DELETE    /api/v1/user': 'user/delete',
  // 'POST    /api/v1/user/avatar': 'user/upload-avatar',
  'POST    /api/v1/user/avatar': 'user/upload-image',
  'PUT   /api/v1/user/password': 'user/password/update',
  'GET   /api/v1/user/campaign-status': 'user/campaign-status',
  'POST   /api/v1/upload-base64-image': 'user/upload-base64-image',
  'PUT    /api/v1/user/files/generate-signed-upload-url':
    'user/files/generate-signed-upload-url',

  'GET    /api/v1/admin/is-admin': 'admin/candidate/is-admin',
  'GET    /api/v1/admin/candidates': 'admin/candidate/list',
  'PUT    /api/v1/admin/candidates/mass-crm-companies-refresh':
    'admin/mass-crm-companies-refresh',
  'GET    /api/v1/admin/hidden-candidates': 'admin/candidate/hidden-list',
  'GET    /api/v1/admin/users': 'admin/all-users',
  'DELETE    /api/v1/admin/user': 'admin/delete-user',
  'POST    /api/v1/admin/user': 'user/admin-create-user',
  'POST   /api/v1/admin/user/impersonate': 'admin/impersonate-user',
  'POST   /api/v1/admin/uploaded-images': 'admin/uploaded-images',
  'POST   /api/v1/admin/upload-image': 'admin/upload-image',
  // for campaign
  'POST    /api/v1/admin/victory-mail': 'admin/victory-mail',
  'PUT    /api/v1/admin/candidate/reactivate': 'admin/candidate/reactivate',
  'PUT    /api/v1/admin/deactivate-candidate-by-campaign':
    'admin/candidate/deactivate-candidate-by-campaign',
  'POST   /api/v1/admin/candidate-enhance': 'admin/candidate-enhance',
  'GET /api/v1/admin/p2v-stats': 'admin/p2v-stats/get',
  'GET /api/v1/admin/campaign/pro-no-voter-file':
    'admin/campaign/pro-no-voter-file',

  'GET   /api/v1/subscribe/email': 'subscribe/subscribe-email',

  'POST   /api/v1/visit': 'visit/create',

  // (public) candidate
  'GET    /api/v1/candidate': 'candidate/find',
  'GET    /api/v1/candidates': 'candidate/list',
  'DELETE    /api/v1/candidate': 'candidate/delete', //admin

  // campaign

  'GET    /api/v1/campaign/deadlines/refresh': 'campaign/deadlines/refresh',
  'GET    /api/v1/campaign/deadlines': 'campaign/deadlines/list',

  'GET /api/v1/campaign/ein-check': 'campaign/ein-check',
  'POST /api/v1/campaign/ein-support-document':
    'campaign/ein-support-document-upload',
  'POST /api/v1/campaign/ein-support-document/:campaignId':
    'campaign/ein-support-document-upload',
  'GET /api/v1/campaign/election-events': 'campaign/election-events',

  // volunteerInvitation

  'POST   /api/v1/campaign/volunteer/invitation':
    'campaign/volunteer/invitation/create',
  'GET   /api/v1/campaign/volunteer/invitations':
    'campaign/volunteer/invitation/list',
  'GET   /api/v1/campaign/volunteer/invitations-by-user':
    'campaign/volunteer/invitation/list-by-user',
  'DELETE   /api/v1/campaign/volunteer/invitation':
    'campaign/volunteer/invitation/delete',
  'POST   /api/v1/campaign/volunteer/request':
    'campaign/volunteer/request/create',
  'GET   /api/v1/campaign/volunteer/requests': 'campaign/volunteer/request/get',
  'GET   /api/v1/campaign/volunteer/request': 'campaign/volunteer/request/get',
  'GET   /api/v1/campaign/volunteer/request/grant':
    'campaign/volunteer/request/grant',
  'DELETE   /api/v1/campaign/volunteer/request':
    'campaign/volunteer/request/delete',

  // campaignVolunteer
  'GET   /api/v1/campaign/volunteers': 'campaign/volunteer/list',
  'GET   /api/v1/campaign/volunteer-by-user': 'campaign/volunteer/list-by-user',
  'POST   /api/v1/campaign/volunteer': 'campaign/volunteer/create',
  'DELETE   /api/v1/campaign/volunteer': 'campaign/volunteer/delete',
  'PATCH   /api/v1/campaign/volunteer': 'campaign/volunteer/update',

  // campaignUpdateHistory

  'POST   /api/v1/campaign/update-history':
    'campaign/campaignUpdateHistory/create',
  'GET   /api/v1/campaign/update-histories':
    'campaign/campaignUpdateHistory/list',
  'DELETE   /api/v1/campaign/update-history':
    'campaign/campaignUpdateHistory/delete',

  // campaign without onboarding
  'POST   /api/v1/campaign': 'campaign/create',
  'POST   /api/v1/admin-campaign': 'campaign/admin-create',
  'POST   /api/v1/admin-campaign-email': 'campaign/admin-create-email',
  'POST   /api/v1/campaign/demo': 'campaign/create-demo-campaign',
  'DELETE   /api/v1/campaign/demo': 'campaign/delete-demo-campaign',
  'PUT   /api/v1/campaign': 'campaign/update',
  'GET   /api/v1/campaign': 'campaign/get',
  'POST   /api/v1/campaign/launch': 'campaign/launch',
  'GET   /api/v1/campaigns': 'campaign/list',
  'GET   /api/v1/campaigns/map': 'campaign/list-map',
  'GET   /api/v1/campaigns/map-count': 'campaign/list-map-count',
  'GET   /api/v1/campaign/by-slug': 'campaign/find-by-slug', //admin
  'PUT   /api/v1/campaign-admin': 'campaign/admin-update', // admin

  // onboarding

  'DELETE   /api/v1/campaign': 'campaign/admin-delete',

  // campaign manager chat
  'POST   /api/v1/campaign/ai/chat': 'campaign/ai/chat/create',
  'PUT   /api/v1/campaign/ai/chat': 'campaign/ai/chat/update',
  'GET   /api/v1/campaign/ai/chat': 'campaign/ai/chat/get',
  'DELETE   /api/v1/campaign/ai/chat': 'campaign/ai/chat/delete',
  'GET   /api/v1/campaign/ai/chats': 'campaign/ai/chat/list',
  'POST   /api/v1/campaign/ai/chat/feedback': 'campaign/ai/chat/feedback',

  // onboarding AI
  'GET   /api/v1/campaign/ai/prompt': 'campaign/ai/prompt/get',
  'POST   /api/v1/campaign/ai': 'campaign/ai/create',
  'POST   /api/v1/campaign/ai/rename': 'campaign/ai/rename',
  'DELETE   /api/v1/campaign/ai': 'campaign/ai/delete',

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

  // crm
  'POST   /api/v1/hubspot-webhook': 'crm/hubspot-webhook',
  'GET   /api/v1/crm/sync': 'crm/sync',
  'GET   /api/v1/crm/refresh-companies': 'crm/refresh-companies',
  'GET   /api/v1/crm/companies/:campaignId': 'crm/get-company',

  // ballotData
  'GET   /api/v1/ballot-data/races': 'campaign/ballotData/races',

  // voterData l2Data
  'GET   /api/v1/voter-data/office': 'voterData/office',
  'POST  /api/v1/voter-data/path-to-victory': 'voterData/path-to-victory',
  'POST  /api/v1/voter-data/voter-file': 'voterData/voterFile/create',
  'GET  /api/v1/voter-data/voter-file': 'voterData/voterFile/get',
  'GET  /api/v1/voter-data/voter-file/wake-up': 'voterData/voterFile/wake-up',
  'POST  /api/v1/voter-data/voter-file/schedule':
    'voterData/voterFile/schedule',
  'POST  /api/v1/voter-data/voter-file/help-message':
    'voterData/voterFile/help-message',
  'GET  /api/v1/voter-data/voter-file/can-download':
    'voterData/voterFile/can-download',
  'GET  /api/v1/voter-data/voter-file/geo-location-cron':
    'voterData/voterFile/geo-location-cron',
  'GET  /api/v1/voter-data/locations': 'voterData/locations',

  // test ai
  'GET   /api/v1/ai/test/match-columns': 'ai/test/match-columns',
  'GET   /api/v1/ai/test/extract-location': 'ai/test/extract-location',
  'GET   /api/v1/ai/test/path-to-victory': 'ai/test/path-to-victory',
  'GET   /api/v1/ai/test/search-column': 'ai/test/search-column',
  'GET   /api/v1/ai/load': 'ai/load',

  // races
  'GET   /api/v1/race/by-state': 'race/by-state',
  'GET   /api/v1/race/all-state': 'race/all-state',
  'GET   /api/v1/race/by-county': 'race/by-county',
  'GET   /api/v1/race/by-city': 'race/by-city',
  'GET   /api/v1/race/proximity-cities': 'race/proximity-cities',
  'GET   /api/v1/race': 'race/get',
  'GET   /api/v1/race/csv': 'race/races-csv',

  'GET   /api/v1/ballotready-s3': 'data-processing/br-candidate-seed', // TODO: change cron job and then remove the route
  'GET   /api/v1/br-candidate-seed': 'data-processing/br-candidate-seed',
  'GET   /api/v1/br-positions': 'data-processing/br-positions',
  'GET   /api/v1/br-elections': 'data-processing/br-elections',
  'GET   /api/v1/br-races': 'data-processing/br-races',
  'GET   /api/v1/br-candidacies': 'data-processing/br-candidacies',
  'GET   /api/v1/bp-candidate-enhance': 'data-processing/bp-candidate-enhance',
  'GET   /api/v1/bp-s3': 'data-processing/bp-s3',
  'GET   /api/v1/techspeed-enhance-cron':
    'data-processing/techspeed-enhance-cron',
  'GET   /api/v1/techspeed-new-candidates':
    'data-processing/techspeed-new-candidates-sheet',
  'GET   /api/v1/nebraska': 'data-processing/nebraska',
  'GET   /api/v1/race-details': 'data-processing/fix-race-details',
  'GET   /api/v1/update-p2vs': 'data-processing/update-p2vs',
  'GET   /api/v1/fetch-election-types': 'data-processing/fetch-election-types',

  // jobs
  'GET   /api/v1/jobs': 'jobs/list',
  'GET   /api/v1/job': 'jobs/get',

  // doorKnocking
  'POST   /api/v1/campaign/door-knocking': 'campaign/doorKnocking/create',
  'PUT   /api/v1/campaign/door-knocking': 'campaign/doorKnocking/update',
  'GET   /api/v1/campaign/door-knockings': 'campaign/doorKnocking/list',
  'GET   /api/v1/campaign/door-knocking': 'campaign/doorKnocking/get',
  'GET   /api/v1/campaign/door-knocking/download':
    'campaign/doorKnocking/download',
  'DELETE   /api/v1/campaign/door-knocking': 'campaign/doorKnocking/delete',
  'PUT   /api/v1/campaign/door-knocking/archive':
    'campaign/doorKnocking/archive',

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

  // survey
  'POST   /api/v1/campaign/door-knocking/survey':
    'campaign/doorKnocking/survey/create',
  'GET   /api/v1/campaign/door-knocking/survey':
    'campaign/doorKnocking/survey/get',
  'PUT   /api/v1/campaign/door-knocking/complete-survey':
    'campaign/doorKnocking/survey/complete',
  'PUT   /api/v1/campaign/door-knocking/skip-survey':
    'campaign/doorKnocking/survey/skip',

  // Payment Processor Integrations
  'POST /api/v1/payments/purchase/checkout-session':
    'payments/checkout-session/create',
  'POST /api/v1/payments/purchase/portal-session':
    'payments/portal-session/create',
  'POST /api/v1/payments/events': 'payments/events',
};
