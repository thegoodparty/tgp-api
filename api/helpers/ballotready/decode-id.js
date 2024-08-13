module.exports = {
  inputs: {
    encoded: {
      type: 'string',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { encoded } = inputs;
      const decoded = Buffer.from(encoded, 'base64').toString('ascii');
      const id = decoded.split('/').pop();
      return exits.success(id);
    } catch (e) {
      console.log('error at encrypt-id', e);
      return exits.success(false);
    }
  },
};
