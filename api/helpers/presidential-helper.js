const mailgun = require('mailgun.js');

module.exports = {
  friendlyName: 'MAIL GUN Sender',

  description:
    'Send email via mailgun. https://github.com/auth0/node-jsonwebtoken',

  inputs: {
    candidate: {
      type: 'json',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { candidate } = inputs;

      const totalRaised = candidate.combinedRaised;
      const largeDonorPerc =
        (totalRaised - candidate.smallContributions) / totalRaised;
      const smallDonorPerc = candidate.smallContributions / totalRaised;
      const hours = 10000;
      const largeDonorPerHour = (totalRaised * largeDonorPerc) / hours;
      const smallDonorPerHour = (totalRaised * smallDonorPerc) / hours;

      const isGood = largeDonorPerc < 0.5;

      return exits.success({
        totalRaised,
        largeDonorPerc,
        smallDonorPerc,
        largeDonorPerHour,
        smallDonorPerHour,
        isGood,
      });
    } catch (e) {
      return exits.badRequest({
        message: 'Error calculating candidate numbers',
      });
    }
  },
};
