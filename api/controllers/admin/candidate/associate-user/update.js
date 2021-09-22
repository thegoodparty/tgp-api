module.exports = {
  inputs: {
    candidateId: {
      type: 'number',
      required: true,
    },
    userEmail: {
      type: 'string',
      isEmail: true,
      required: true,
    },
  },

  exits: {
    success: {
      description: 'AllCandidates',
    },

    badRequest: {
      description: 'Error getting candidates',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const { candidateId, userEmail } = inputs;
      const user = await User.findOne({ email: userEmail });
      console.log('user', user);
      if (!user) {
        console.log('no user');
        return this.res.notFound();
      }
      await User.updateOne({ email: userEmail }).set({
        candidate: candidateId,
      });

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log('Error at admin/candidate/associate-user', e);
      await sails.helpers.errorLoggerHelper(
        'Error at admin/candidate/associate-user',
        e,
      );
      return exits.badRequest({
        message: 'Error associating user and candidate',
      });
    }
  },
};
