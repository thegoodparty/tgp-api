const mailgun = require('mailgun.js');

module.exports = {
  friendlyName: 'MAIL GUN Sender',

  description:
    'Send email via mailgun. https://github.com/auth0/node-jsonwebtoken',

  inputs: {
    incumbent: {
      type: 'json',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { incumbent } = inputs;

      const totalRaised = incumbent.raised + incumbent.pacRaised;
      const largeDonorsPerc =
        (totalRaised - incumbent.smallContributions) / totalRaised;
      const hours = incumbent.chamber === 'House' ? 2000 : 10000;
      const largeDonorPerHour =
        (totalRaised - incumbent.smallContributions) / hours;

      return exits.success({totalRaised, largeDonorsPerc, largeDonorPerHour});

    } catch (e) {
      return exits.badRequest({
        message: 'Error calculating incumbent numbers',
      });
    }
  },
};
