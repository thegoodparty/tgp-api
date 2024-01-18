module.exports = {
  friendlyName: 'Logger helper',
  description: 'Logging',

  inputs: {
    slug: {
      type: 'string',
      required: true,
    },
    arg1: {
      type: 'ref',
      required: true,
    },
    arg2: {
      type: 'ref',
    },
    arg3: {
      type: 'ref',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const { arg1, arg2, arg3 } = inputs;
      if (arg1 && arg2 && arg3) {
        console.log(`[${inputs.slug}]`, arg1, arg2, arg3);
      } else if (arg1 && arg2) {
        console.log(`[${inputs.slug}]`, arg1, arg2);
      } else if (arg1) {
        console.log(`[${inputs.slug}]`, arg1);
      }
      return exits.success('');
    } catch (e) {
      return exits.badRequest('');
    }
  },
};
