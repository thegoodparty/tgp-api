const shortParty = {
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
      const { firstName, lastName } = newData.candidate;
      // create candidate in our system
      const newCandidate = await Candidate.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        isActive: true,
        chamber: 'local',
      }).fetch();

      const { party, otherParty } = newData.candidate;
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
      } = newData.socialMedia;

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
        heroVideo: campaignVideo ? getParameterByName('v', campaignVideo) : '',
        headline,
        race: newData.campaign['running for'],
        about: campaignSummary,
        state,
        party: party === 'Other' ? otherParty : shortParty[party],
        facebook,
        twitter,
        tiktok,
        snap,
        youtube,
        reddit,
        linkedin,
        website,
        image: transparentImg,
        user: newData.user,
        raceDate: electionDate,
      };

      await Candidate.updateOne({ id: newCandidate.id }).set({
        data: JSON.stringify(cleanCandidate),
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
          title,
          summary: body,
          link,
          image,
          candidate: newCandidate.id,
        });
      }

      for (let i = 0; i < topIssues.length; i++) {
        const { selectedTopic, selectedPosition, description } = topIssues[i];
        if (selectedTopic && selectedPosition) {
          await CandidateIssueItem.create({
            candidate: newCandidate.id,
            topic: selectedTopic.id,
            positionId: selectedPosition.id,
            description,
            status: 'accepted',
          });
        }
      }

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

function getParameterByName(name, url) {
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

const application = {
  createdAt: 1646615427024,
  updatedAt: 1646615427024,
  id: 1,
  status: 'in review',
  user: 1,
  pledge: {
    disAffiliate: true,
    notJoin: true,
    noPay: true,
    peoplePowered: true,
    honest: true,
    transparent: true,
    choices: true,
    isCompleted: true,
  },
  candidate: {
    firstName: 'Tomer',
    lastName: 'Almog',
    zip: '91406',
    citizen: 'Yes',
    ranBefore: 'No',
    electedBefore: 'No',
    memberPolitical: 'No',
    partyHistory: '',
    ethnicity: '',
    race: '',
    pronouns: '',
    twitter: 'goodparty',
    facebook: 'goodparty',
    youtube: '',
    linkedin: '',
    snap: '',
    tiktok: '',
    reddit: '',
    website: 'https://mysite.com',
    candidatePhone: '13109759102',
    candidateEmail: 'tomeralmog@gmail.com',
    party: 'Forward',
    otherParty: 'sdadsa',
    dob: '2021-11-03',
  },
  campaign: {
    'running for': 'Mayor of my home',
    electionDate: '2022-04-24',
    state: 'AK',
    district: '',
    campaignSummary: 'This is my campaign summary',
    campaignVideo: 'https://www.youtube.com/watch?v=0JrrFQ0si-8d',
    photos: [
      {
        key: 'headshotPhoto',
        label: 'Candidate headshot',
        value: '',
      },
      {
        key: 'trailPhoto',
        label: 'Campaign trail photo',
        value: '',
      },
      {
        key: 'bannerPhoto',
        label: 'Campaign page banner',
        value: '',
      },
    ],
    committeeName: '',
    candidacyStatement: 'No',
    fecStatement: 'No',
    fromWhom: 'Yes',
    signatures: '1000',
    likelySupport: '1200',
    votesToWin: '5000',
    twitter: 'campaign',
    facebook: 'campaign',
    youtube: '',
    linkedin: '',
    snap: '',
    tiktok: '',
    reddit: '',
    website: 'https://campaign.com',
    headshotPhoto:
      'https://assets.goodparty.org/candidate-info/d2e3e28d-fa11-40c1-92ff-8d3476175e78.jpg',
    moneyRaisedAmount: 'Less than $10,000',
    headline: 'Mandate Freedom!',
  },
  contacts: {
    candidateEmail: 'candidate@candiate.com',
    candidatePhone: '5555555555',
    contactName: 'Tomer Almog',
    contactRole: 'sdsd',
    contactEmail: 'tomeralmog@gmail.com',
    contactPhone: '13109759102',
    contactAddress: '6656 Langdon Avenue',
  },
  issues: {
    positions: [
      {
        id: '18ixscq7ss',
        name: 'Free healthcare',
      },
      {
        id: '5u4gxfhisl',
        name: 'No Mandate',
      },
    ],
  },
  endorsements: [
    {
      body: 'This is an endorsement from the application',
      link: 'https://proof.com',
      title: 'Endorsement title',
      image:
        'https://assets.goodparty.org/candidate-info/644bcdbe-b77d-4cca-88f5-291b3cfdebbd.jpg',
    },
  ],
  socialMedia: {
    candidateTwitter: '',
    candidateFacebook: '123',
    candidateYoutube: '',
    candidateLinkedin: '',
    candidateSnap: '',
    candidateTiktok: '',
    candidateReddit: '',
    candidateWebsite: '',
    twitter: 'tomeralmog@gmail.com',
    facebook: 'fff',
    youtube: 'yyy',
    linkedin: '',
    snap: '',
    tiktok: '',
    reddit: '',
    website: '',
  },
  topIssues: [
    {
      selectedTopic: {
        createdAt: 1645497898804,
        updatedAt: 1645497907134,
        id: 1,
        topic: 'Healthcare',
        positions: [
          {
            id: '18ixscq7ss',
            name: 'Free healthcare',
          },
        ],
      },
      selectedPosition: {
        id: '18ixscq7ss',
        name: 'Free healthcare',
      },
      description: '',
    },
    {
      selectedTopic: null,
      selectedPosition: null,
      description: '',
    },
    {
      selectedTopic: null,
      selectedPosition: null,
      description: '',
    },
    {
      selectedTopic: null,
      selectedPosition: null,
      description: '',
    },
    {
      selectedTopic: null,
      selectedPosition: null,
      description: '',
    },
  ],
  reviewMode: false,
};
