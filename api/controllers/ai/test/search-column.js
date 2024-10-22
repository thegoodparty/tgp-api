const getSearchColumn = require('../../../utils/campaign/getSearchColumn');

module.exports = {
  friendlyName: 'Test getSearchColumn',

  description: 'Test the getSearchColumn function.',

  inputs: {},

  exits: {
    success: {
      description: 'Ok',
      responseType: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    const response = await getSearchColumn(
      'testing',
      'City_Council_Commissioner_District',
      'CA',
      'San Clemente City Council',
      'District 1',
    );
    console.log(response);
    return exits.success({
      message: response,
    });
  },
};
