let twilioClient;
module.exports = {
  friendlyName: 'Phone Verification helper',

  description: 'Phone verification helper using twilio API',

  inputs: {
    candidate: {
      type: 'ref',
      required: true,
    },
    user: {
      type: 'ref',
      required: true,
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { candidate, user } = inputs;
      if (user.isAdmin) {
        return exits.success('admin');
      }
      const staff = await Staff.findOne({
        candidate: candidate.id,
        user: user.id,
      });
      if (staff) {
        return exits.success(staff.role);
      }
      return exits.success(false);
    } catch (e) {
      return exits.success(false);
    }
  },
};
