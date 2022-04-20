const shortParty = {
  Independent: 'I',
  Democratic: 'D',
  Republican: 'R',
  Green: 'GP',
  Libertarian: 'L',
  SAM: 'S',
  Forward: 'F',
};

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
      const { user } = this.req;
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
      const {
        firstName,
        lastName,
        party,
        otherParty,
        zip,
        candidateEmail,
        candidatePhone,
      } = newData.candidate;
      // create candidate in our system
      const newCandidate = await Candidate.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        isActive: true,
        chamber: 'local',
        contact: {
          contactFirstName: firstName.trim(),
          contactLastName: lastName.trim(),
          contactEmail: candidateEmail,
          contactPhone: candidatePhone,
        },
      }).fetch();

      const {
        campaignSummary,
        headline,
        state,
        headshotPhoto,
        electionDate,
        campaignVideo,
      } = newData.campaign;

      const {
        twitter,
        facebook,
        youtube,
        linkedin,
        snap,
        tiktok,
        reddit,
        website,
      } = newData.socialMedia || {};

      // endorsements, top issues

      // create a transparent image
      const transparentImg = await sails.helpers.images.transparentImage(
        headshotPhoto,
        `${newCandidate.firstName}-${newCandidate.lastName}`,
      );

      const cleanCandidate = {
        id: newCandidate.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        isActive: true,
        isDraft: false,
        chamber: 'local',
        heroVideo: campaignVideo ? campaignVideo : '',
        headline,
        race: newData.campaign['running for'],
        about: campaignSummary,
        state,
        party: party === 'Other' ? otherParty : shortParty[party],
        facebook: addSocial(facebook, 'facebook.com'),
        twitter: addSocial(twitter, 'twitter.com'),
        tiktok: addSocial(tiktok, 'tiktok.com'),
        snap: addSocial(snap, 'snap.com'),
        youtube: addSocial(youtube, 'youtube.com'),
        reddit: addSocial(reddit, 'reddit.com'),
        linkedin: addSocial(linkedin, 'linkedin.com'),
        website,
        image: transparentImg,
        user: newData.user,
        raceDate: electionDate,
        zip,
      };

      await Candidate.updateOne({ id: newCandidate.id }).set({
        data: JSON.stringify(cleanCandidate),
        state,
      });

      await Staff.create({
        role: 'owner',
        user: newData.user,
        candidate: newCandidate.id,
        createdBy: user.id,
      });

      const { endorsements, topIssues } = newData;
      for (let i = 0; i < endorsements.length; i++) {
        const { link, title, body, image } = endorsements[i];
        await Endorsement.create({
          title: title || 'no title',
          summary: body,
          link,
          image,
          candidate: newCandidate.id,
        });
      }
      if (topIssues) {
        for (let i = 0; i < topIssues.length; i++) {
          const { selectedTopic, selectedPosition, description } = topIssues[i];
          if (selectedTopic && selectedPosition) {
            await CandidatePosition.create({
              candidate: newCandidate.id,
              topIssue: selectedTopic.id,
              position: selectedPosition.id,
              description,
              order: i + 1,
            });
            await Candidate.addToCollection(
              newCandidate.id,
              'positions',
              selectedPosition.id,
            );
            await Candidate.addToCollection(
              newCandidate.id,
              'topIssues',
              selectedTopic.id,
            );
          }
        }
      }

      await sails.helpers.triggerCandidateUpdate(newCandidate.id);
      try {
        await sendSlackMessage(newData);
      } catch (e) {
        console.log('error sending slack');
      }

      const finalCandidate = await Candidate.findOne({ id: newCandidate.id });
      await sails.helpers.crm.updateCandidate(finalCandidate);

      const applicationUser = await User.findOne({ id: application.user });
      await sails.helpers.crm.updateUser(applicationUser);

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

function addSocial(handle, base) {
  if (!handle || handle === '') {
    return handle;
  }
  return `https://${base}/${handle}`;
}
