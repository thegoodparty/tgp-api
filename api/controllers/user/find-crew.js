/**
 * user/find-crew.js
 *
 * @description :: Receiving contacts array and returning a hash with matching users in our system
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
  friendlyName: 'Find Crew',

  description:
    'Receiving contacts array and returning a hash with matching users in our system',

  inputs: {
    contacts: {
      description: 'Contacts from phone',
      type: ['json'],
    },
  },

  exits: {
    success: {
      description: 'Crew Found.',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error finding crew',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    const { contacts } = inputs;
    if (!contacts) {
      return exits.badRequest({
        message: 'missing contacts',
      });
    }
    const crew = {};
    let contact;
    for (let i = 0; i < contacts.length; i++) {
      contact = contacts[i];
      if (contact.id && contact.phone) {
        const user = await User.findOne({ phone: contact.phone });
        if (user) {
          crew[contact.id] = true;
        }
      }
    }
    return exits.success({
      crew,
    });
  },
};
