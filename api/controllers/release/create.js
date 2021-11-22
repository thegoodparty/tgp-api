module.exports = {
  friendlyName: 'create a release',

  inputs: {
    releaseNote: {
      type: 'string',
      required: true,
    },
    releaseType: {
      type: 'string',
      required: true,
    },
    releaseDate: {
      type: 'string',
      required: true,
    },
    isOnline: {
      type: 'boolean',
    }
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
      const { releaseNote, releaseType, releaseDate, isOnline } = inputs;
      await Release.create({
        releaseNote,
        releaseType,
        releaseDate,
        isOnline,
      });

      return exits.success({
        message: 'created',
      });
    } catch (e) {
      console.log('error at release/create', e);
      return exits.badRequest({
        message: 'Error creating release',
        e,
      });
    }
  },
};
