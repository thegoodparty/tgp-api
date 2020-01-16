const inviteContact = require('./invite-contact');
module.exports = {
  friendlyName: 'Invite All Contact',

  description: 'invite multiple contacts',

  inputs: {
    contacts: {
      description: 'stringified array of phone, firstName and lastName objects',
      example: '[{ phone: "3109759100", firstName: "John", lastName: "Smith"}]',
      required: true,
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Invitations sent successfully',
    },

    badRequest: {
      description: 'Error inviting contacts',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { contacts } = inputs;
      const reqUser = this.req.user;
      const parsedContacts = JSON.parse(contacts);

      const emptyExists = {
        success: () => {},
        badRequest: e => {
          console.log('error in invite contact inner', e);
        },
      };
      for (let i = 0; i < Math.max(parsedContacts.length, 10); i++) { // TODO remove before deploy
        // for (let i = 0; i < parsedContacts.length; i++) {
        const contact = parsedContacts[i];
        if (contact.firstName && contact.lastName && contact.phone) {
          try {
            await inviteContact.fn({ ...contact, user: reqUser }, emptyExists);
          } catch (e) {
            console.log('error in invite all contacts loop ', e);
          }
        }
      }
      return exits.success({
        message: 'Invitation sent successfully',
      });
    } catch (e) {
      console.log('***** ERROR in invite-all-contacts *****');
      console.log(JSON.stringify(e));
      console.log(e);
      return exits.badRequest({
        message: 'Error inviting contacts',
      });
    }
  },
};
