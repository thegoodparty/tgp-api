module.exports = {
  friendlyName: 'L2 Counts',

  description: 'Get L2 Data Counts',

  inputs: {},

  exits: {
    success: {
      description: 'Ok',
    },

    badRequest: {
      description: 'Error getting l2 counts',
      responseType: 'badRequest',
    },
  },

  // Test view for testing l2Data/counts

  fn: async function (inputs, exits) {
    try {
      // const counts = await sails.helpers.campaign.countHelper(
      //   2,
      //   2023,
      //   'NC',
      //   'Town_District',
      //   'NC##HILLSBOROUGH TOWN',
      // );
      // const counts = await sails.helpers.campaign.countHelper(
      //   2,
      //   2023,
      //   'TN',
      //   'City',
      //   'TN##NASHVILLE CITY (METRO) (EST.)',
      //   'TN##NASHVILLE CITY (METRO) (EST.)##NASHVILLE CITY (METRO) CNCL 29 (EST.)',
      // );

      const counts = await sails.helpers.campaign.countHelper(
        2,
        2023,
        'WA',
        'Judicial_Appellate_District',
        'WA##COURT OF APPEALS DIVISION 1 (EST.)',
        '',
      );

      return exits.success({
        success: true,
        message: counts,
      });
    } catch (e) {
      console.log('error at l2Data/counts', e);
      return exits.success({
        error: true,
        e,
      });
    }
  },
};
