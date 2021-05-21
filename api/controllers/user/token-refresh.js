module.exports = {
  friendlyName: 'Token Refresh',

  description: 'get refresh token and updated user',

  inputs: {
  },

  exits: {
    success: {
      description: 'Token Refresh',
    },

    badRequest: {
      description: 'Error token refresh',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    const user = this.req.user;
    // const userWithZip = await User.findOne({ id: user.id });
    // const userZipCode = await ZipCode.findOne({
    //   id: userWithZip.zipCode,
    // }).populate('cds');
    // userWithZip.zipCode = userZipCode;

    const token = await sails.helpers.jwtSign({
      id: user.id,
      email: user.email,
    });

    return exits.success({
      user,
      token,
    });
  },
};
