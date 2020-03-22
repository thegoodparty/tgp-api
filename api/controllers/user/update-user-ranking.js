module.exports = {
  friendlyName: 'Update User Ranking',

  description: 'update chamber ranking for a logged in user.',

  inputs: {
    presidentialRank: {
      description: 'stringified array of presidential candidates ids',
      example: '[1,3,2]',
      required: false,
      type: 'string',
    },

    senateRank: {
      description: 'stringified array of senate candidates ids',
      example: '[1,3,2]',
      required: false,
      type: 'string',
    },

    houseRank: {
      description: 'stringified array of house candidates ids',
      example: '[1,3,2]',
      required: false,
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'User successfully updated.',
    },

    badRequest: {
      description: 'Error updating user',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const reqUser = this.req.user;
      const { presidentialRank, senateRank, houseRank } = inputs;
      if (!presidentialRank && !senateRank && !houseRank) {
        return exits.badRequest({
          message: 'presidentialRank, senateRank or houseRank are required',
        });
      }

      const updateFields = {};
      if (presidentialRank) {
        updateFields.presidentialRank = presidentialRank;
      }
      if (senateRank) {
        updateFields.senateRank = senateRank;
      }
      if (houseRank) {
        updateFields.houseRank = houseRank;
      }

      await User.updateOne({ id: reqUser.id }).set(updateFields);

      const user = await User.findOne({ id: reqUser.id });
      const zipCode = await ZipCode.findOne({
        id: user.zipCode,
      }).populate('cds');
      user.zipCode = zipCode;

      return exits.success({
        user,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error saving address',
      });
    }
  },
};

const sendEmail = async (reqEmail, email) => {
  const token = await sails.helpers.strings.random('url-friendly');
  const user = await User.updateOne({ email: reqEmail }).set({
    emailConfToken: token,
    emailConfTokenDateCreated: Date.now(),
    isEmailVerified: false,
  });

  const appBase = sails.config.custom.appBase || sails.config.appBase;
  const subject = `Please Confirm your email address - The Good Party`;
  const message = `Hi ${user.name},<br/> <br/>
                         Welcome to The Good Party! In order to get counted, you need to confirm your email address. <br/> <br/>
                         <a href="${appBase}/email-confirmation?email=${email}&token=${user.emailConfToken}">Confirm Email</a>`;
  const messageHeader = 'Please confirm your email';
  await sails.helpers.mailgunSender(
    email,
    user.name,
    subject,
    messageHeader,
    message,
  );
};
