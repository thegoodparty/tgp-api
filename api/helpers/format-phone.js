module.exports = {
  friendlyName: 'format phone',

  inputs: {
    phone: {
      type: 'string',
      required: true,
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { phone } = inputs;

      const input = phone.replace(/\D/g, '').substring(0, 10); // First ten digits of input only
      const zip = input.substring(0, 3);
      const middle = input.substring(3, 6);
      const last = input.substring(6, 10);

      if (input.length > 6) {
        return exits.success(`+1 (${zip}) ${middle}-${last}`);
      }
      if (input.length > 3) {
        return exits.success(`+1 (${zip}) ${middle}`);
      }
      if (input.length > 0) {
        return exits.success(`+1 (${zip}`);
      }
    } catch (e) {
      exits.success('');
    }
  },
};
