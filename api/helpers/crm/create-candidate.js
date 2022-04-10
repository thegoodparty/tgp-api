// https://developers.hubspot.com/docs/api/crm/contacts
const hubspot = require('@hubspot/api-client');
const slugify = require('slugify');

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
    console.log('in crm create candidate. Got candidate', candidate.contact);
    const data = JSON.parse(candidate.data);
    try {
      const slug = slugify(`${data.firstName} ${data.lastName}`);
      const companyObj = {
        properties: {
          name: `${data.firstName} ${data.lastName} for ${data.race}`,
          candidate_name: `${data.firstName} ${data.lastName}`,
          candidate_office: data.race,
          about_us: data.about,
          candidate_party: partyResolver(data.party),
          candidate_state: data.state,
          zip: data.zip,
          type: 'CAMPAIGN',
          candidate_email: candidate.contact.contactEmail,
          phone: candidate.contact.contactPhone,
          domain: `${appBase}/candidate/${slug}/${candidate.id}`,
        },
      };

      const existingId = candidate.contact.hubspotId;
      console.log('existingId', existingId, candidate.contact);
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
