const searchMiscDistricts = require('../../../utils/campaign/searchMiscDistricts');

module.exports = {
  friendlyName: 'Test ai',

  description: 'Test ai function calling',

  inputs: {},

  exits: {
    success: {
      description: 'Ok',
      responseType: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    let slug = 'test';
    const officeName = 'Flagstaff Unified School District 3';
    const matchedColumns = await searchMiscDistricts(
      slug,
      officeName,
      'city',
      'CA',
    );

    return exits.success({
      matchedColumns,
    });
  },
};
