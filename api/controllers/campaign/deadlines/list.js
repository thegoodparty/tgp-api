module.exports = {
  friendlyName: 'List election deadlines',

  inputs: {},

  exits: {
    success: {
      description: 'Created',
    },
    badRequest: {
      description: 'Error listing',
      responseType: 'badRequest',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
  },

  async fn(inputs, exits) {
    try {
      //   const user = this.req.user;

      const deadlines = await ElectionDeadlines.find({});

      return exits.success({
        deadlines,
      });
    } catch (e) {
      console.log('error at campaign/deadlines/list', e);
      return exits.badRequest({
        message: 'Error finding ElectionDeadlines',
        e,
      });
    }
  },
};
