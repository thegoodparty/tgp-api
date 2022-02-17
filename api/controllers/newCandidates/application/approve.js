module.exports = {
  friendlyName: 'Admin application approval',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
    feedback: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'approved',
    },

    badRequest: {
      description: 'Error approving',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const { id, feedback } = inputs;
      const application = await Application.findOne({
        id,
      });
      let existingData = {};
      if (application.data && application.data !== '') {
        existingData = JSON.parse(application.data);
      }
      delete application.data;

      const newData = {
        ...application,
        ...existingData,
        feedback,
        status: 'approved',
      };

      await Application.updateOne({
        id,
      }).set({
        status: 'approved',
        data: JSON.stringify(newData),
      });
      const { firstName, lastName } = newData.candidate;
      // create candidate in our system
      const newCandidate = await Candidate.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        isActive: true,
        chamber: 'local',
      }).fetch();
      const {
        campaignSummary,
        state,
        facebook,
        twitter,
        tiktok,
        snap,
        youtube,
        reddit,
        votesToWin,
        likelySupport,
        headshotPhoto,
      } = newData.campaign;

      const cleanCandidate = {
        id: newCandidate.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        isActive: true,
        chamber: 'local',
        headline: campaignSummary,
        state,
        party: 'I',
        facebook,
        twitter,
        tiktok,
        snap,
        youtube,
        reddit,
        votesNeeded: votesToWin,
        likelyVoters: likelySupport,
        image: headshotPhoto,
        race: newData.campaign['running for'],
        user: newData.user,
      };

      await Candidate.updateOne({ id: newCandidate.id }).set({
        data: JSON.stringify(cleanCandidate),
      });
      await sails.helpers.triggerCandidateUpdate(newCandidate.id);
      try {
        await sendSlackMessage(newData);
      } catch (e) {
        console.log('error sending slack');
      }

      return exits.success({
        application: newData,
      });
    } catch (e) {
      console.log('error at applications/approve', e);
      return exits.badRequest({
        message: 'Error approving applications',
        e,
      });
    }
  },
};

async function sendSlackMessage(data) {
  const appBase = sails.config.custom.appBase || sails.config.appBase;
  let env = 'dev';
  if (appBase === 'https://goodparty.org') {
    env = 'prod';
  }

  const message = {
    text: `Candidate application approved. ENV: ${env}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Candidate application approved. ENV: ${env}. (This is a temp message)`,
        },
      },
    ],
  };

  await sails.helpers.slackHelper(message, 'content');
}
