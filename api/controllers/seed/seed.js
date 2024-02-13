const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    let count = 0;
    try {
      return exits.success({
        message: `updated ${count} campaigns`,
      });
    } catch (e) {
      console.log('Error in seed', e);
      return exits.success({
        message: 'Error in seed',
        e,
        error: JSON.stringify(e),
      });
    }
  },
};
