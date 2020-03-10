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
      const smallDonorPerc = 1 - largeDonorPerc;
      const hours = 10000;
      const largeDonorPerHour = (totalRaised * largeDonorPerc) / hours;
      const smallDonorPerHour = (totalRaised * smallDonorPerc) / hours;

      let isGood = false;
      if (totalRaised < 10000000 || largeDonorPerc < 0.5) {
        isGood = true;
      }

      return exits.success({
        totalRaised,
        largeDonorPerc,
        largeDonorPerHour,
        smallDonorPerHour,
        smallDonorPerc,
        isGood,
      });
    } catch (e) {
      return exits.badRequest({
        message: 'Error calculating candidate numbers',
      });
    }
  },
};
