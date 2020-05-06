module.exports = {
  friendlyName: 'Seed - Presidential',

  description: 'presidential race database seed',

  inputs: {},

  exits: {
    success: {
      description: 'presidential race seeded',
    },

    badRequest: {
      description: 'Error seeding database',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const sources = [
        {
          name: 'Donald Trump',
          source:
            'https://ballotpedia.org/Donald_Trump_presidential_campaign,_2020',
        },
        {
          name: 'Joe Biden',
          source:
            'https://ballotpedia.org/Joe_Biden_presidential_campaign,_2020',
        },
        {
          name: 'Bernie Sanders',
          source:
            'https://ballotpedia.org/Bernie_Sanders_presidential_campaign,_2020',
        },
        {
          name: 'Elizabeth Warren',
          source:
            'https://ballotpedia.org/Elizabeth_Warren_presidential_campaign,_2020',
        },
        {
          name: 'Andrew Yang',
          source:
            'https://ballotpedia.org/Andrew_Yang_presidential_campaign,_2020',
        },
        {
          name: 'Howie Hawkins',
          source: 'https://ballotpedia.org/Howie_Hawkins',
        },
        {
          name: 'Jacob Hornberger',
          source: 'https://ballotpedia.org/Jacob_Hornberger',
        },
      ];
      for (let i = 0; i < sources.length; i++) {
        const cand = sources[i];
        await PresidentialCandidate.updateOne({
          name: cand.name,
        }).set({
          source: cand.source,
        });
      }
      return exits.success({
        seed: 'ok',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error getting candidates',
      });
    }
  },
};
