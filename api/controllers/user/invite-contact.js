module.exports = {
  friendlyName: 'Invite Contact',

  description: 'send sms to invite a contact',

  inputs: {
    phone: {
      description: 'Phone',
      example: '3109751234',
      required: true,
      type: 'string',
      maxLength: 11,
      minLength: 10,
    },

    firstName: {
      description: "Contact's First Name",
      example: 'John',
      required: true,
      type: 'string',
    },

    lastName: {
      description: "Contact's Last Name",
      example: 'Smith',
      required: true,
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Invitation sent successfully',
    },

    badRequest: {
      description: 'Error inviting contact',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    console.log('***** invite-contact *****');
    try {
      console.log('invite-contact1');
      const reqUser = this.req.user;
      console.log('invite-contact2');
      const { phone, firstName, lastName } = inputs;
      console.log('invite-contact3', phone, name);

      // await sails.helpers.sendSms(
      //   `+1${phone}`,
      //   `${reqUser.name}: Hey ${name}, check out The Good Party! https://exp.host/@tgp-expo/tgp-native-apps`,
      // );
      console.log('invite-contact4');
      await sails.helpers.sendSms(
        `+1${reqUser.phone}`,
        `${reqUser.name}: Hey ${firstName}, check out The Good Party! https://exp.host/@tgp-expo/tgp-native-apps`,
      );
      console.log('invite-contact5');

      const user = await User.findOne({ id: reqUser.id });
      const invited = user.invited;
      console.log('invite-contact6');
      if (!invited) {
        await User.updateOne({ id: reqUser.id }).set({
          invited: JSON.stringify([phone]),
        });
      } else {
        const updatedInvited = JSON.parse(invited);
        if (!updatedInvited.includes(phone)) {
          updatedInvited.push(phone);
          await User.updateOne({ id: reqUser.id }).set({
            invited: JSON.stringify(updatedInvited),
          });
        }
      }
      console.log('invite-contact7');

      // update invited table
      const invitedPhone = await Invited.findOne({ phone });
      if (invitedPhone) {
        const invitedBy = JSON.parse(invitedPhone.invitedBy);
        if (!invitedBy.includes(reqUser.id)) {
          invitedBy.push({ id: reqUser.id, name: `${firstName} ${lastName}` });
        }
        await Invited.updateOne({ id: invitedPhone.id }).set({
          invitedBy: JSON.stringify(invitedBy),
        });
      } else {
        const invitedBy = JSON.stringify([
          { id: reqUser.id, name: `${firstName} ${lastName}` },
        ]);
        await Invited.create({ phone, invitedBy });
      }
      console.log('invite-contact8');

      return exits.success({
        message: 'Invitation sent successfully',
      });
    } catch (e) {
      console.log('***** ERROR in invite-contact *****');
      console.log(JSON.stringify(e));
      console.log(e);
      return exits.badRequest({
        message: 'Error inviting contact',
      });
    }
  },
};
