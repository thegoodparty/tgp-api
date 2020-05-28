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
      await PresidentialCandidate.create({
        openSecretsId: '123',
        name: 'Jo Jorgensen',
        party: 'LP',
        image: 'http://assets.thegoodparty.org/candidates/jorgenson.jpg',
        combinedRaised: 22365,
        smallContributions: 22365,
        campaignReportDate: 'March 31, 2020',
        outsideReportDate: 'March 31, 2020',
        isActive: true,
        isApproved: false,
        isAligned: 'yes',
        isCertified: false,
        source: 'https://www.fec.gov/data/candidate/P00013524/',
        isIncumbent: false,
      });
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

/*

openSecretsId: {
      type: 'string',
      required: true,
      unique: true,
    },

    outsideReportDate: {
      type: 'string',
    },
    info: {
      type: 'string',
      allowNull: true,
    },
    isIncumbent: {
      type: 'boolean',
      allowNull: true,
    },
    isActive: {
      type: 'boolean',
      allowNull: true,
    },
    isApproved: {
      type: 'boolean',
      allowNull: true,
    },
    isAligned: {
      type: 'string',
      defaultsTo: 'unknown',
      isIn: ['unknown', 'yes', 'no'],
      allowNull: true,
    },
    isCertified: {
      type: 'boolean',
      allowNull: true,
    },
    source: {
      type: 'string',
      allowNull: true,
    },
 */
