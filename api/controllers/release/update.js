module.exports = {
  friendlyName: 'edit issueTopic',

  inputs: {
    release: {
      type: 'json',
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
      const { release } = inputs;
      await Release.updateOne({ id: release.id }).set({
        releaseNote: release.releaseNote,
        releaseDate: release.releaseDate,
        releaseType: release.releaseType,
        isOnline: release.isOnline,
        tags: release.tags,
      });

      return exits.success({
        message: 'updated',
      });
    } catch (e) {
      console.log('error at release/update', e);
      return exits.badRequest({
        message: 'Error updating release',
        e,
      });
    }
  },
};
