const appBase = sails.config.custom.appBase || sails.config.appBase;
const { USER_ROLES } = require('../../models/users/User');

module.exports = {
  inputs: {
    userId: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Email Sent',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Email Send Failed',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const { userId } = inputs;
      const user = await User.findOne({ id: userId });
      if (!user) {
        return exits.badRequest({ message: 'User not found' });
      }
      const { firstName, email } = user;

      await sendEmail(firstName, email);

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error sending set password email.' });
    }
  },
};

async function sendEmail(firstName, email) {
  const token = await createToken(email);
  const encodedEmail = email.replace('+', '%2b');
  const link = encodeURI(
    `${appBase}/set-password?email=${encodedEmail}&token=${token}`,
  );
  const variables = {
    name: firstName,
    link,
  };
  const subject = 'GoodParty.org: Access your free campaign resources!';

  await sails.helpers.mailgun.mailgunTemplateSender(
    email,
    subject,
    'set-password',
    variables,
  );
}

async function createToken(email) {
  // Come up with a pseudorandom, probabilistically-unique token for use
  // in our password recovery email.
  const token = await sails.helpers.strings.random('url-friendly');

  // Store the token on the user record
  // (This allows us to look up the user when the link from the email is clicked.)
  await User.update({ email }).set({
    passwordResetToken: token,
    passwordResetTokenExpiresAt:
      Date.now() + sails.config.custom.passwordResetTokenTTL,
  });

  return token;
}
