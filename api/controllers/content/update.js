/**
 * content/update
 *
 * @description :: Updates the  content from our CMS.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'All Content',

  description: 'Updates the  content from our CMS',

  inputs: {},

  exits: {
    success: {
      description: 'Able to fetch all content',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Phone Format Error',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      // fetch content from the api
      const content = await sails.helpers.contentful();

      // process content - create new DB entries based on content
      await processContent(content);

      // now that we created or updated the candidates from the CMS,
      // we want to replace the candidates in the response with the
      // db candidates ordered by states

      const candidatesByState = await statesWithCandidates();
      content.candidatesByState = candidatesByState;
      content.candidates = null;

      const stringifiedContent = JSON.stringify(content);

      // save content to our DB. Make sure we have only one version of the content
      // first see if we already have an entry
      const contents = await CmsContent.find();
      if (contents.length === 0) {
        // no content yet, create one
        await CmsContent.create({
          content: stringifiedContent,
        });
      } else if (contents.length > 1) {
        console.log('something is off. more than one entry');
        await CmsContent.updateOne({ id: contents[0].id }).set({
          content: stringifiedContent,
        });
      } else {
        await CmsContent.updateOne({ id: contents[0].id }).set({
          content: stringifiedContent,
        });
      }

      return exits.success();
    } catch (err) {
      console.log('content error');
      console.log(err);
      return exits.badRequest({
        message: 'Content fetch failed. Please load again.',
      });
    }
  },
};

const processContent = async content => {
  // create or update candidates based on cms candidates;
  const candidates = content.candidates;
  if (candidates) {
    candidates.map(async cmsCandidate => {
      const candidate = await Candidate.find({ name: cmsCandidate.name });
      const longStateName = states[cmsCandidate.state.toUpperCase()];
      const state = await State.findOrCreate(
        { shortName: cmsCandidate.state.toLowerCase() },
        {
          name: longStateName,
          shortName: cmsCandidate.state.toLowerCase(),
        },
      );

      const congDistrict = await CongDistrict.findOrCreate(
        {
          code: cmsCandidate.districtNumber,
          state: state.id,
        },
        {
          name: `${longStateName} ${cmsCandidate.districtNumber} congressional district`,
          code: cmsCandidate.districtNumber,
          state: state.id,
          ocdDivisionId: `ocd-division/country:us/stats:${cmsCandidate.state.toLowerCase()}/cd:${
            cmsCandidate.districtNumber
          }`,
        },
      );

      if (candidate.length === 0) {
        // candidate doesn't exist in our db, create a new one.
        // first create the state if doesn't exist

        await Candidate.create({
          ...cmsCandidate,
          state: state.id,
          congDistrict: congDistrict.id,
        });
      } else {
        await Candidate.updateOne({ name: cmsCandidate.name }).set({
          ...cmsCandidate,
          state: state.id,
          congDistrict: congDistrict.id,
        });
      }
    });
  }
};

const statesWithCandidates = async () => {
  const allStates = await State.find().populate('candidates');
  const onlyCandidates = [];
  allStates.map(state => {
    if (state.candidates.length > 0) {
      onlyCandidates.push(state);
    }
  });
  for (let i = 0; i < onlyCandidates.length; i++) {
    for (let j = 0; j < onlyCandidates[i].candidates.length; j++) {
      const candidate = onlyCandidates[i].candidates[j];
      const district = await CongDistrict.findOne({
        id: candidate.congDistrict,
      });
      candidate.districtName = district.name;
      candidate.code = district.code;
      candidate.ocdDivisionId = district.ocdDivisionId;
    }
  }

  return onlyCandidates;
};

const states = {
  AL: 'Alabama',
  AK: 'Alaska',
  AS: 'American Samoa',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  DC: 'District Of Columbia',
  FM: 'Federated States Of Micronesia',
  FL: 'Florida',
  GA: 'Georgia',
  GU: 'Guam',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MH: 'Marshall Islands',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  MP: 'Northern Mariana Islands',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PW: 'Palau',
  PA: 'Pennsylvania',
  PR: 'Puerto Rico',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VI: 'Virgin Islands',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
};
