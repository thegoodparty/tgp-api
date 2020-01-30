/**
 * user/save-contacts.js
 *
 * @description :: Save Raw contacts. No use at the time of writing this code.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
  friendlyName: 'Save Contacts',

  description: 'Save Raw contacts',

  inputs: {
    contacts: {
      description: 'Raw contacts from phone',
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Contacts saved.',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error finding crew',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { contacts } = inputs;

      const reqUser = this.req.user;

      const user = await User.findOne({ id: reqUser.id });
      const rawContacts = user.rawContacts;
      if (!rawContacts) {
        // no raw contacts. Need to create a new one.
        const newRaw = await RawContacts.create({
          rawContacts: contacts,
        }).fetch();
        await User.updateOne({ id: reqUser.id }).set({
          rawContacts: newRaw.id,
        });
      } else {
        await RawContacts.updateOne({ id: rawContacts }).set({
          rawContacts: contacts,
        });
      }

      return exits.success({
        message: 'Contacts saved.',
      });
    } catch (e) {
      console.log('error at save contacts');
      console.log(e);
      return exits.badRequest({
        message: 'Error saving contacts',
        error: JSON.stringify(e)
      });
    }
  },
};
