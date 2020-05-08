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
          image: 'http://assets.thegoodparty.org/candidates/trump.jpg',
        },
        {
          name: 'Joe Biden',
          source:
            'https://ballotpedia.org/Joe_Biden_presidential_campaign,_2020',
          image: 'http://assets.thegoodparty.org/candidates/biden.jpg',
        },
        {
          name: 'Bernie Sanders',
          source:
            'https://ballotpedia.org/Bernie_Sanders_presidential_campaign,_2020',
          image: 'http://assets.thegoodparty.org/candidates/sanders.jpg',
        },
        {
          name: 'Elizabeth Warren',
          source:
            'https://ballotpedia.org/Elizabeth_Warren_presidential_campaign,_2020',
          image: 'http://assets.thegoodparty.org/candidates/warren.jpg',
        },
        {
          name: 'Andrew Yang',
          source:
            'https://ballotpedia.org/Andrew_Yang_presidential_campaign,_2020',
          image: 'http://assets.thegoodparty.org/candidates/yang.jpg',
        },
        {
          name: 'Howie Hawkins',
          source: 'https://ballotpedia.org/Howie_Hawkins',
          image: 'http://assets.thegoodparty.org/candidates/hawkins.jpg',
        },
        {
          name: 'Jacob Hornberger',
          source: 'https://ballotpedia.org/Jacob_Hornberger',
          image: 'http://assets.thegoodparty.org/candidates/hornberger.jpg',
        },
      ];
      for (let i = 0; i < sources.length; i++) {
        const { name, source, image } = sources[i];
        await PresidentialCandidate.updateOne({
          name,
        }).set({
          source,
          image,
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
