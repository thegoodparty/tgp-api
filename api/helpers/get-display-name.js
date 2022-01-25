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
        if(user && user.displayName) {
            return exits.success(user.displayName);
        }
        if(user && user.name) {
            const initials = await sails.helpers.fullFirstLastInitials(user && user.name);
            return exits.success(initials);
        }
        return exits.success('');
      } catch (e) {
        return exits.success('');
      }
    },
  };
  