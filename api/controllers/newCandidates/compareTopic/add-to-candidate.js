module.exports = {
  friendlyName: 'Associate a candidate and a topic',

  inputs: {
    topicId: {
      type: 'number',
      required: true,
    },
    candidateId: {
      type: 'number',
      required: true,
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
      const { topicId, candidateId } = inputs;
      await CompareTopic.addToCollection(topicId, 'candidates', candidateId);

      return exits.success({
        message: 'associated',
      });
    } catch (e) {
      console.log('error at compareTopic/add-to-candidate', e);
      return exits.badRequest({
        message: 'Error associating topic and candidate',
        e,
      });
    }
  },
};
