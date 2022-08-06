const moment = require('moment');

module.exports = {
  friendlyName: 'Count followers for a candidate',

  inputs: {
    candidate: {
      type: 'ref',
    },
    days: {
      type: 'number',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { candidate, days } = inputs;
      const candidateData = JSON.parse(candidate.data);

      const name = `${candidateData.firstName} ${candidateData.lastName}`;
      const brand = await SocialBrand.findOne({ name });
      const results = [];
      if (brand) {
        for (let i = days - 1; i >= 0; i--) {
          const date = moment()
            .subtract(i, 'days')
            .format('YYYY-MM-DD');
          const followers = await SocialStat.find({
            socialBrand: brand.id,
            date,
          });

          const total = totalFollowers(followers);
          const dateMD = moment()
            .subtract(i, 'days')
            .format('M-D');
          results.push({
            date: dateMD,
            total,
          });
        }
      }

      return exits.success(results);
    } catch (e) {
      console.log(
        'error at helpers/socialListening/candidate-followers-by-day-helper',
        e,
      );
      return exits.success([]);
    }
  },
};

const totalFollowers = followers => {
  let total = 0;
  followers.forEach(item => {
    total += item.count;
  });
  return total;
};
