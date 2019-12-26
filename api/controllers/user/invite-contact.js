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

    name: {
      description: "Contact's Name",
      example: 'John Smith',
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
    try {
      const reqUser = this.req.user;
      const { phone, name } = inputs;

      const user = await User.findOne({ id: reqUser.id });
      const invited = user.invited;
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

      // await sails.helpers.sendSms(
      //   `+1${phone}`,
      //   `${reqUser.name}: Hey ${name}, check out The Good Party! https://exp.host/@tgp-expo/tgp-native-apps`,
      // );
      sails.helpers.sendSms(
        `+1${reqUser.phone}`,
        `${reqUser.name}: Hey ${name}, check out The Good Party! https://exp.host/@tgp-expo/tgp-native-apps`,
      );

      return exits.success({
        message: 'Invitation sent successfully',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error inviting contact',
      });
    }
  },
};
