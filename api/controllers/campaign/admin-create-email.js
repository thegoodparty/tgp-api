const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {
    userId: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Campaign Created',
      responseType: 'ok',
    },
    badRequest: {
      description: 'creation failed',
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
      const { firstName, lastName, email } = user;

      await sendEmail(firstName, lastName, email);

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error creating campaign.' });
    }
  },
};

async function sendEmail(firstName, lastName, email) {
  const token = await createToken(email);
  const encodedEmail = email.replace('+', '%2b');
  const link = encodeURI(
    `${appBase}/set-password?email=${encodedEmail}&token=${token}`,
  );
  const variables = {
    content: `<div style="color:#000000">
  Hi ${firstName} ${lastName},
  <br />
  <br />
  It was great learning more about your campaign, and we're excited to help however we can.
  <br />
  <br />
  To get started, please set up your password by clicking the button below. This will give you access to your dashboard, where you'll find all of our free tools including content creation, campaign tracker, and voter data.
  <br />
  <br />

  <table
      width="300"
      style="
        width: 300px;
        background-color: #0D1528;
        border-radius: 8px;
      "
      border="0"
      cellspacing="0"
      cellpadding="0"
      align="center"
    >
      <tr>
        <td
          class="em_white"
          height="42"
          align="center"
          valign="middle"
          style="
            font-family: Arial, sans-serif;
            font-size: 16px;
            color: #ffffff;
            font-weight: bold;
            height: 42px;
          "
        >
          <a
            href="${link}"
            target="_blank"
            style="
              text-decoration: none;
              color: #ffffff;
              line-height: 42px;
              display: block;
            "
          >
            Set Your Password
          </a>
        </td>
      </tr>
    </table>
    <br />
    <br />

    Also, we encourage you to share our endorsement of your campaign on social media using our share kit. Please follow this link to Canva to access the templates and receive instructions for accessing your endorsement image. Or, you can use this link for a quick video tutorial. Let us know if you have any questions about this, and please tag @goodpartyorg should you decide to post. We'll share it with our followers! 
    <br />
    <br /> 
For more information about the offering and our organization, check out these links at your leisure:
<ul>
<li>An interactive demo of how to use GoodParty.org</li>
<li>An overview of the benefits and our free campaigning tools</li>
<li>More information about our mission and vision for empowering grassroots, independent candidates</li>
</ul>
If you have any questions about how to access the tool, our free SMS and yard signs offering, or would like to speak with one of our political associates, please let us know. We're thrilled to endorse your campaign and wish you the best of luck.
    <br />
    <br /> 
All the best,
    <br />
    <br />
GoodParty.org Team
</div>
  `,
  };

  await sails.helpers.mailgun.mailgunTemplateSender(
    email,
    'Welcome to GoodParty.org! Set Up Your Account and Access Your Campaign Tools',
    'blank-email',
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