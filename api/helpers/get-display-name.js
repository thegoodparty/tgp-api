module.exports = {
    friendlyName: 'Full First Last Initials',
  
    inputs: {
      user: {
        type: 'json',
        required: true,
      },
    },
  
    fn: async function(inputs, exits) {
      try {
        const { user } = inputs;
        if(user.displayName) {
            return exits.success(user.displayName);
        }
        const initials = await sails.helpers.fullFirstLastInitials(user.name);
        return exits.success(initials);
      } catch (e) {
        return exits.success('');
      }
    },
  };
  