module.exports = {
  friendlyName: 'Full First Last Initials',

  inputs: {
    name: {
      type: 'string',
      required: true,
    },
  },

  fn: async function(inputs, exits) {
    const { name } = inputs;
    const names = name.split(' ');
    if (names.length > 1) {
      return exits.success(`${names[0]} ${names[names.length - 1].charAt(0)}.`);
    }
    if (names.length === 1) {
      return exits.success(names[0]);
    }
    return exits.success('');
  },
};
