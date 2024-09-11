/* eslint-disable object-shorthand */

const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {
    candidateId: {
      type: 'json',
    },
  },

  exits: {
    success: {
      outputDescription: 'Campaign Found',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { candidateId } = inputs;

      const candidate = await BallotCandidate.findOne({
        where: {
          and: [
            { id: candidateId },
            { party: { '!=': 'Republican' } },
            { party: { '!=': 'Democratic' } },
          ],
        },
      })
        .populate('positions')
        .populate('races')
        .populate('elections');

      if (!candidate) {
        return exits.success(false);
      }

      const {
        id,
        slug,
        firstName,
        lastName,
        middleName,
        positionName,
        party,
        state,
        p2vData,
        positions,
        brCandidacyData,
        campaign,
        brData,
        vendorTsData,
      } = candidate;

      let officeDescription;
      let salary;
      let term;
      let image;
      if (positions && positions.length) {
        officeDescription = positions[0].data.description;
        term =
          positions[0].data.electionFrequencies &&
          positions[0].data.electionFrequencies.length
            ? `${positions[0].data.electionFrequencies[0].frequency[0]} Years`
            : undefined;
        salary = positions[0].data.salary;
      }
      if (brData?.image_url) {
        image = brData.image_url;
      }
      let topIssues;
      if (brCandidacyData?.stances && brCandidacyData.stances.length) {
        topIssues = brCandidacyData.stances.map((s) => {
          return {
            issue: s.issue.name,
            stance: s.statement,
            referenceUrl: s.referenceUrl,
          };
        });
      }

      const data = {
        id,
        slug,
        firstName,
        lastName,
        middleName,
        office: positionName,
        party,
        state,
        p2vData,
        officeDescription,
        term,
        salary,
        endorsements: brCandidacyData?.endorsements,
        topIssues,
        image,
        claimed: !!campaign,
        updatedAt: new Date(),
      };

      // for candidates who are created via techspeed
      if (!brData && vendorTsData) {
        const {
          website_url,
          linkedin_url,
          instagram_handle,
          twitter_handle,
          facebook_url,
          city,
          state,
          postal_code,
        } = vendorTsData;
        data.socialUrls = [
          { type: 'website', url: website_url },
          { type: 'linkedin', url: linkedin_url },
          { type: 'instagram', url: instagram_handle },
          { type: 'twitter', url: twitter_handle },
          { type: 'facebook', url: facebook_url },
        ];
        data.city = city;
        data.state = state;
        data.zip = postal_code;
      }

      const { mtfcc, geo_id, urls } = brData || {};
      const geoData = await resolveMtfcc(mtfcc, geo_id);

      // todo: switch to the helper? but it may get updated soon
      // const geoData = await sails.helpers.ballotready.resolveMtfcc(
      //   mtfcc,
      //   geo_id,
      // );

      data.geoData = geoData;
      if (geoData?.city) {
        data.city = geoData.city;
      }

      const socialUrls = parseUrl(urls);

      data.socialUrls = socialUrls;

      // keep about last so we send all the data to the AI
      const about = await generateAbout(data);
      data.about = about;

      return exits.success(data);
    } catch (e) {
      console.log('error in helpers/candidate/generate-presentation', e);
      return exits.success(false);
    }
  },
};
async function resolveMtfcc(mtfcc, geoId) {
  let geoData;
  // geoId is a string that an start with 0, so we need remove that 0
  geoId = geoId ? parseInt(geoId, 10).toString() : undefined;
  if (mtfcc && geoId) {
    const census = await CensusEntity.findOne({ mtfcc, geoId });
    if (census) {
      geoData = {
        name: census.name,
        type: census.mtfccType,
      };
      if (census.mtfccType !== 'State or Equivalent Feature') {
        geoData.city = census.name;
      }
    }
  }
  return geoData;
}

async function generateAbout(data) {
  // based on the data generate a tokenized phrase like this: use html <br/><br/> for line breaks
  // topIssues is an array of objects with issue, stance, referenceUrl
  /*
<<First Name>> <<Last Name>> is running for <<office name>> in <<city>>, <<state>> (if judge/state legislative/congress, put District name, state).  <<last name>> is running as a <<party>> candidate, making them eligible to receive GoodParty.org's support. <<office name>> is responsible for <<office responsibilities>>.
break
If endorsements are known: <<Last name>> is endorsed by <<endorsing organizations>>.
If endorsements are unknown: Empty
break
If top issues are known: <<Last name>> is running on <<issue list>>
If issues are unknown: Empty
break
<<Last name>> is running for a <<term length>> year term.
*/

  const {
    firstName,
    lastName,
    office,
    city,
    state,
    officeDescription,
    endorsements,
    topIssues,
    term,
  } = data;

  let about = `${firstName} ${lastName} is running for ${office}`;
  if (city) {
    about += ` in ${city}, ${state}`;
  } else {
    about += ` in ${state}`;
  }
  about += `, making them eligible to receive GoodParty.org's support. ${
    officeDescription ? `${office} is responsible for ${officeDescription}` : ''
  }<br/><br/>`; // eslint-disable-line
  if (endorsements && endorsements.length) {
    about += `${lastName} is endorsed by ${endorsements.join(', ')}.<br/><br/>`;
  }
  if (topIssues && topIssues.length) {
    about += `${lastName} is running on ${topIssues
      .map((i) => i.issue)
      .join(', ')}.<br/><br/>`;
  }
  if (term) {
    about += `${lastName} is running for a ${term
      .toLowerCase()
      .replace('years', 'year')} term.`;
  }
  return about;
}

function parseUrl(urls) {
  //urls: '[{"type"=>"facebook", "website"=>"https://www.facebook.com/DevineForSenate"}, {"type"=>"government", "website"=>"https://www.scstatehouse.gov/member.php?code=0477840852"}, {"type"=>"linkedin", "website"=>"https://www.linkedin.com/in/tameikaisaacdevine/"}, {"type"=>"twitter", "website"=>"https://twitter.com/TIDEVINE"}, {"type"=>"website", "website"=>"https://devineforsenate.com/"}]',
  let parsedUrls;
  try {
    if (!urls) {
      return;
    }
    const cleanUrls = urls.replace(/=>/g, ':');
    parsedUrls = JSON.parse(cleanUrls);
    if (parsedUrls && parsedUrls.length) {
      parsedUrls = parsedUrls.map((url) => {
        return {
          type: url.type,
          url: url.website,
        };
      });
    }
  } catch (e) {
    console.log('error parsing urls', e);
  }
  return parsedUrls;
}
