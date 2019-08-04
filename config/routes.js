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

  'PUT    /api/v1/entrance/login': 'entrance/login',
  'POST   /api/v1/entrance/register': 'entrance/register',

  'POST   /api/v1/entrance/send-password-recovery-email':
    'entrance/send-password-recovery-email',
  'PUT   /api/v1/entrance/update-password-and-login':
    'entrance/update-password-and-login',

  'POST   /api/v1/role/create': 'role/create',

  'GET    /api/v1/user/check': 'user/check',
  'PUT    /api/v1/user/change-password': 'user/change-password',
  'PUT    /api/v1/user/update-user': 'user/update-user',
  'PUT    /api/v1/user/update-address': 'user/update-address',
  'PUT    /api/v1/user/verify-phone': 'user/verify-phone',

  'GET    /api/v1/elections/user-elections': 'elections/user-elections',

  'POST   /api/v1/candidate/create': 'candidate/create',
  'GET    /api/v1/candidate/find/:id': 'candidate/find',
};
