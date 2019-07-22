module.exports = {
  friendlyName: 'Update Address',

  description: 'update password for a logged in user.',

  inputs: {
    address: {
      description: 'display address',
      example: '123 main street, Los Angeles CA 90210',
      required: true,
      type: 'string',
    },
    addressComponents: {
      description: 'Google autocomplete address components. stringified JSON',
      required: true,
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Address successfully updated.',
    },

    badRequest: {
      description: 'Error updating address',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const user = this.req.user;
      const { address, addressComponents } = inputs;
      if (!address || !addressComponents) {
        return exits.badRequest();
      }

      await User.updateOne({ id: user.id }).set({
        address,
        addressComponents,
      });

      return exits.success({
        message: 'Address updated',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest();
    }
  },
};
