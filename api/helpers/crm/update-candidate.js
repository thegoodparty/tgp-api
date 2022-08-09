// https://developers.hubspot.com/docs/api/crm/contacts
const hubspot = require('@hubspot/api-client');
const slugify = require('slugify');
const moment = require('moment');

const hubSpotKey = sails.config.custom.hubSpotKey || sails.config.hubSpotKey;
const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {
    candidate: {
      type: 'json',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'ok',
    },

    badRequest: {
      description: 'Error',
    },
  },
  fn: async function(inputs, exits) {
    if (!hubSpotKey) {
      // for non production env.
      return exits.success('no api key');
    }
    const hubspotClient = new hubspot.Client({ apiKey: hubSpotKey });

    const { candidate } = inputs;
    const data = JSON.parse(candidate.data);
    try {
      const slug = slugify(`${data.firstName} ${data.lastName}`);
      const totalImpressions = await ButtonImpression.count({
        candidate: candidate.id,
        type: 'impression',
      });
      const endorsementsCount = await Endorsement.count({
        candidate: candidate.id,
      });

      const candidatePositions = await CandidatePosition.find({
        candidate: candidate.id,
      })
        .sort([{ order: 'ASC' }])
        .populate('topIssue')
        .populate('position');

      let topIssues = '';
      candidatePositions.forEach(candPosition => {
        topIssues += `Top Issue: ${candPosition.topIssue.name} | Position: ${candPosition.position.name} | Candidate Position: ${candPosition.description} \n`;
      });

      const followers = await sails.helpers.socialListening.candidateFollowersHelper(
        candidate,
      );
      let thisWeek = 0;
      let lastWeek = 0;
      if (followers) {
        thisWeek = followers.thisWeek;
        lastWeek = followers.lastWeek;
      }
      const diff = thisWeek - lastWeek;

      const {
        firstName,
        lastName,
        race,
        isActive,
        about,
        party,
        zip,
        state,
        facebook,
        twitter,
        tiktok,
        instagram,
        heroVideo,
      } = data;
      const companyObj = {
        properties: {
          name: `${firstName} ${lastName} for ${race}`,
          candidate_name: `${firstName} ${lastName}`,
          campaign_id: candidate.id,
          is_active: !!isActive,
          candidate_office: race,
          about_us: about,
          candidate_party: partyResolver(party),
          candidate_state: state,
          zip,
          twitter_url: twitter,
          tiktok_url: tiktok,
          facebook_url: facebook,
          instagram_url: instagram,
          video_added: !!heroVideo,
          type: 'CAMPAIGN',
          candidate_email: candidate.contact.contactEmail,
          phone: candidate.contact.contactPhone,
          domain: `${appBase}/candidate/${slug}/${candidate.id}`,
          installed_button: totalImpressions,
          featured_endorsements: endorsementsCount,
          top_issues: topIssues,
          modify_page: moment().format('YYYY-MM-DD'),
          follower_count: thisWeek,
          follower_growth: diff,
        },
      };

      const existingId = candidate.contact.hubspotId;
      if (existingId) {
        await hubspotClient.crm.companies.basicApi.update(
          existingId,
          companyObj,
        );
        return exits.success(existingId);
      } else {
        // update user record with the id from the crm
        const createCompanyResponse = await hubspotClient.crm.companies.basicApi.create(
          companyObj,
        );

        const hubspotId = createCompanyResponse.id;
        await Candidate.updateOne({ id: candidate.id }).set({
          data: JSON.stringify({
            ...data,
          }),
          contact: { ...candidate.contact, hubspotId },
        });
        return exits.success(hubspotId);
      }
    } catch (e) {
      console.log('hubspot error', e);
      return exits.success('not ok');
    }
  },
};

const partyResolver = (partyLetter, otherParty) => {
  if (!partyLetter) {
    return '';
  }
  if (partyLetter === 'Other' && otherParty) {
    return otherParty;
  }
  if (partyLetter === 'D') {
    return 'Democratic';
  }
  if (partyLetter === 'R') {
    return 'Republican';
  }
  if (partyLetter === 'GP') {
    return 'Green';
  }
  if (partyLetter === 'LP' || partyLetter === 'L') {
    return 'Libertarian';
  }
  if (partyLetter === 'LI') {
    return 'Liberation';
  }
  if (partyLetter === 'I') {
    return 'Independent';
  }
  if (partyLetter === 'VC') {
    return 'Vetting Challengers';
  }
  if (partyLetter === 'U') {
    return 'Unity';
  }
  if (partyLetter === 'UUP') {
    return 'United Utah';
  }
  if (partyLetter === 'W') {
    return 'Working Families';
  }
  if (partyLetter === 'S') {
    return 'SAM';
  }
  if (partyLetter === 'F') {
    return 'Forward';
  }
  return partyLetter;
};
