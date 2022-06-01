module.exports = {
  friendlyName: 'edit topIssue',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
    name: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Updated',
    },

    badRequest: {
      description: 'Error updating',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const { id, name } = inputs;
      await TopIssue.updateOne({ id }).set({
        name,
      });
      await sails.helpers.cacheHelper('clear', 'all');

      return exits.success({
        message: 'updated',
      });
    } catch (e) {
      console.log('error at topIssue/update', e);
      return exits.badRequest({
        message: 'Error updating topIssue',
        e,
      });
    }
  },
};
