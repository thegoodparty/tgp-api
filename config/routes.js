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
  'PUT    /api/v1/entrance/verify-phone': 'entrance/verify-phone',
  'GET    /api/v1/entrance/zip-to-district': 'entrance/zip-to-district',
  'GET    /api/v1/entrance/address-to-district': 'entrance/address-to-district',

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

  'GET    /api/v1/elections/user-elections': 'elections/user-elections',

  'GET    /api/v1/pledges/user-pledges': 'pledges/user-pledges',

  'POST   /api/v1/candidate/create': 'candidate/create',
  'GET    /api/v1/candidate/find/:id': 'candidate/find',

  'PUT    /api/v1/admin/make-admin': 'admin/make-admin',
  'GET    /api/v1/admin/all-users': 'admin/all-users',
  'GET    /api/v1/admin/thresholds': 'admin/thresholds',
  'GET    /api/v1/admin/cd-with-count': 'admin/cd-with-count',
  'GET    /api/v1/admin/senate-with-count': 'admin/senate-with-count',
  'GET    /api/v1/admin/cd-weekly-trend': 'admin/cd-weekly-trend',
  'GET    /api/v1/admin/senate-weekly-trend': 'admin/senate-weekly-trend',
  'POST   /api/v1/admin/candidate': 'admin/create-candidate',
  'GET    /api/v1/admin/candidates': 'admin/all-candidates',
  'POST    /api/v1/admin/seed': 'admin/seed',
};
