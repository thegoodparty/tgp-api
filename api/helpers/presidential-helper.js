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
      const largeDonorsPerc =
        (totalRaised - candidate.smallContributions) / totalRaised;
      const hours = 10000;
      const largeDonorPerHour = (totalRaised * largeDonorsPerc) / hours;

      const isGood = largeDonorsPerc < 0.5;

      return exits.success({
        totalRaised,
        largeDonorsPerc,
        largeDonorPerHour,
        isGood,
      });
    } catch (e) {
      return exits.badRequest({
        message: 'Error calculating candidate numbers',
      });
    }
  },
};
