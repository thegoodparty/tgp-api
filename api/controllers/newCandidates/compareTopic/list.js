module.exports = {
  friendlyName: 'User supports a candidate',

  inputs: {
    format: {
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Created',
    },

    badRequest: {
      description: 'Error creating',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const { format } = inputs;
      const topics = await CompareTopic.find().sort([{ name: 'ASC' }]);
      if (format && format === 'hash') {
        let hash = {};
        hash = topics.reduce((obj, item) => {
          return {
            ...obj,
            [item.name]: item.description,
          };
        }, hash);
        return exits.success({
          topics: hash,
        });
      }

      return exits.success({
        topics,
      });
    } catch (e) {
      console.log('error at compareTopic/create', e);
      return exits.badRequest({
        message: 'Error creating topic',
        e,
      });
    }
  },
};
