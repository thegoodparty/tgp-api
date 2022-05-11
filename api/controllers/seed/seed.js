/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  inputs: {
    formId: {
      type: 'string',
      required: true,
    },
  },

  exits: {},

  async fn(inputs, exits) {
    try {
      const { formId } = inputs;
      const count = await sails.helpers.crm.formSubmissions(formId);

      return exits.success({
        count,
      });
    } catch (e) {
      console.log('Error in seed', e);
      return exits.success({
        message: 'Error in seed',
        error: JSON.stringify(e),
      });
    }
  },
};
