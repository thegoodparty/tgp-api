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

  'PUT    /api/v1/entrance/login': 'entrance/login',
  'POST   /api/v1/entrance/register': 'entrance/register',
  'GET   /api/v1/entrance/resend-verify-email': 'entrance/resend-verify-email',
  'PUT    /api/v1/entrance/verify-phone': 'entrance/verify-phone',
  'GET    /api/v1/entrance/zip-to-district': 'entrance/zip-to-district',
  'GET    /api/v1/entrance/address-to-district': 'entrance/address-to-district',
  'PUT    /api/v1/entrance/confirm-email': 'entrance/confirm-email',

  'POST   /api/v1/entrance/send-password-recovery-email':
    'entrance/send-password-recovery-email',
  'PUT   /api/v1/entrance/update-password-and-login':
    'entrance/update-password-and-login',

  'POST    /api/v1/notifications/email-ama': 'notifications/email-ama',

  'POST   /api/v1/role/create': 'role/create',

  'GET    /api/v1/user/check': 'user/check',
  'PUT    /api/v1/user/change-password': 'user/change-password',
  'PUT    /api/v1/user/update-user': 'user/update-user',
  'PUT    /api/v1/user/update-address': 'user/update-address',
  'POST    /api/v1/user/upload-avatar': 'user/upload-avatar',
  'POST    /api/v1/user/find-crew': 'user/find-crew', // post because of payload size.
  'PUT    /api/v1/user/invite-contact': 'user/invite-contact',
  'PUT    /api/v1/user/invite-all-contacts': 'user/invite-all-contacts',
  'GET    /api/v1/user/recruited-by-user': 'user/recruited-by-user',
  'GET    /api/v1/user/crew-member': 'user/crew-member',
  'POST    /api/v1/user/save-contacts': 'user/save-contacts',

  'GET    /api/v1/elections/user-elections': 'elections/user-elections',

  'GET    /api/v1/pledges/user-pledges': 'pledges/user-pledges',

  'PUT    /api/v1/admin/make-admin': 'admin/make-admin',
  'GET    /api/v1/admin/all-users': 'admin/all-users',
  'GET    /api/v1/admin/thresholds': 'admin/thresholds',
  'GET    /api/v1/admin/cd-with-count': 'admin/cd-with-count',
  'GET    /api/v1/admin/senate-with-count': 'admin/senate-with-count',
  'GET    /api/v1/admin/cd-weekly-trend': 'admin/cd-weekly-trend',
  'GET    /api/v1/admin/senate-weekly-trend': 'admin/senate-weekly-trend',
  'POST   /api/v1/admin/candidate': 'admin/create-candidate',
  'GET    /api/v1/admin/candidates': 'admin/all-candidates',

  'POST    /api/v1/seed/seed': 'seed/seed',
  'POST    /api/v1/seed/seed-election-dates': 'seed/seed-election-dates',
  'POST    /api/v1/seed/seed-incumbents': 'seed/seed-incumbents',
  'GET    /api/v1/seed/seed-presidential': 'seed/seed-presidential',
  'POST    /api/v1/seed/seed-race-candidates': 'seed/seed-race-candidates',

  'GET    /api/v1/district/state': 'district/state',
  'GET    /api/v1/district/total-supporters': 'district/total-supporters',
  'GET    /api/v1/district/cong-district': 'district/cong-district',

  'GET    /api/v1/incumbent/find-by-id': 'incumbent/find-by-id',
  'GET    /api/v1/incumbent/all': 'incumbent/all',
  'GET    /api/v1/incumbent/find-by-district': 'incumbent/find-by-district',

  'GET    /api/v1/race-candidate/house-by-district':
    'race-candidate/house-by-district',
  'GET    /api/v1/race-candidate/senate-by-state':
    'race-candidate/senate-by-state',

  'GET    /api/v1/presidential/all': 'presidential/all',

  'GET    /api/v1/candidates/find': 'candidates/find',

  'GET    /api/v1/counts/user-counts': 'counts/user-counts',
};
