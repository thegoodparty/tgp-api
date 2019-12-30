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
    const contactsPhones = [];
    const contactsPhonesToIds = {};
    const crew = {};
    let contact;
    for (let i = 0; i < contacts.length; i++) {
      contact = contacts[i];
      if (contact.id && contact.phone) {
        contactsPhones.push(contact.phone);
        contactsPhonesToIds[contact.phone] = {
          id: contact.id,
          name: contact.name,
        };
      }
    }

    const users = await User.find({ phone: contactsPhones })
      .populate('congDistrict')
      .populate('zipCode')
      .populate('recruits');
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const contactId = contactsPhonesToIds[user.phone].id;
      crew[contactId] = {
        district: user.congDistrict ? user.congDistrict.name : '',
        image: user.avatar,
        feedback: user.feedback,
        name: contactsPhonesToIds[user.phone].name,
        recruits: user.recruits ? user.recruits.length : 0,
        zipCode: user.zipCode,
      };
    }

    return exits.success({
      crew,
    });
  },
};
