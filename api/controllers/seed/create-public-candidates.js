const slugify = require('slugify');

module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      let counter = 0;
      const ballotCandidates = await BallotCandidate.find()
        .populate('positions')
        .populate('elections')
        .populate('races');

      for (let i = 0; i < ballotCandidates.length; i++) {
        const ballotCandidate = ballotCandidates[i];
        const {
          id,
          firstName,
          lastName,
          state,
          positionName,
          brData,
          parties,
          electionName,
          electionDay,
          electionResult,
          level,
          normalizedPositionName,
        } = ballotCandidate;

        const { urls, imageUrl, middleName } = brData;
        const slug = slugify(`${firstName}-${lastName}-${positionName}`, {
          lower: true,
        });

        const urlsArray = urls ? urls.split(' ') : [];

        const data = {
          slug,
          firstName,
          middleName,
          lastName,
          state,
          positionName,
          normalizedPositionName,
          parties,
          electionName,
          electionDay,
          electionResult,
          level,
          imageUrl,
          urls: urlsArray,
        };
        console.log('data', data);
      }

      await sails.helpers.slack.errorLoggerHelper(
        `updated ${counter} campaigns`,
        {},
      );
      return exits.success({
        message: `created ${counter} public candidates`,
        ballotCandidates,
      });
    } catch (e) {
      console.log('Error in create-public-candidates', e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error at create-public-candidates',
        e,
      );
      return exits.success({
        message: 'Error in create-public-candidates',
        e,
        error: JSON.stringify(e),
      });
    }
  },
};

const ballotCandidateExample = {
  createdAt: 1718418311075,
  updatedAt: 1718418311075,
  id: 1,
  firstName: 'Heather',
  middleName: 'Tomer',
  lastName: 'Graham',
  state: 'CO',
  parsedLocation: 'Pueblo',
  positionName: 'Pueblo City Mayor',
  normalizedPositionName: 'City Executive//Mayor',
  brData: {
    subAreaName: '',
    subAreaValue: '',
    subAreaNameSecondary: '',
    subAreaValueSecondary: '',
    urls: 'https://www.facebook.com/grahamforpueblo/ https://www.pueblo.us/directory.aspx?EID=134 https://www.heathergrahamformayor.com/home ',
    imageUrl:
      'https://assets.civicengine.com/uploads/candidate/headshot/587413/587413.jpg',
    suffix: '',
    nickname: '',
    middleName: '',
    numberOfSeats: '1',
    geofenceIsNotExact: 'false',
    geofenceId: '1249059',
    normalizedPositionId: '1500',
    mtfcc: 'G4110',
    geoId: '0862000',
    candidacyId: '844446',
    candidacyCreatedAt: '2023-11-21 18:55:39.351',
    candidacyUpdatedAt: '2024-01-24 17:21:22.983',
  },
  bpData: null,
  vendorTsData: null,
  email: 'grahamforpueblo@gmail.com',
  phone: '719-406-5970',
  vendorTsPhone: '',
  vendorTsEmail: '',
  candidateId: '587413',
  ballotHashId: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvQ2FuZGlkYXRlLzU4NzQxMw==',
  bpCandidateId: '',
  raceId: '2801374',
  positionId: '417235',
  electionId: '7121',
  parties: 'Nonpartisan',
  electionName: 'Pueblo Mayoral Runoff Election',
  electionDay: '2024-01-23',
  electionResult: 'GENERAL_WIN',
  level: 'city',
  tier: '3',
  isJudicial: false,
  isRetention: false,
  isPrimary: false,
  isRunoff: true,
  isUnexpired: false,
  campaign: null,
  positions: [
    {
      createdAt: 1718418334596,
      updatedAt: 1718418334596,
      id: 1,
      ballotId: '163969',
      ballotHashId: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvUG9zaXRpb24vMTYzOTY5',
      data: {
        appointed: false,
        createdAt: '2018-02-12T15:59:06.388Z',
      },
      ballotElection: 1,
    },
  ],
  elections: [
    {
      createdAt: 1718418334246,
      updatedAt: 1718418334246,
      id: 1,
      ballotId: '5191',
      ballotHashId:
        'Z2lkOi8vYmFsbG90LWZhY3RvcnkvRWxlY3RvcnkvRWxlY3Rpb24vNTE5MQ==',
      electionDate: '2024-02-13',
      state: 'OK',
      data: {
        electionDay: '2024-02-13',
        id: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvUG9zaXRpb25FbGVjdGlvbi8yODAxMzc0',
      },
    },
  ],
  races: [
    {
      createdAt: 1718418310749,
      updatedAt: 1718418310749,
      id: 1,
      ballotId: '2801374',
      ballotHashId:
        'Z2lkOi8vYmFsbG90LWZhY3RvcnkvUG9zaXRpb25FbGVjdGlvbi8yODAxMzc0',
      hashId: '7a7f09',
      positionSlug: 'city-executivemayor',
      state: 'CO',
      electionDate: 1705968000000,
      level: 'city',
      subAreaName: '',
      subAreaValue: '',
      isJudicial: false,
      isPrimary: false,
      data: {
        position_name: 'Pueblo City Mayor',
        state: 'CO',
        race_id: 2801374,
        is_primary: false,
        is_judicial: false,
        sub_area_name: null,
        sub_area_value: null,
        filing_periods: '[]',
        election_day: '2024-01-23',
        normalized_position_name: 'City Executive//Mayor',
        level: 'city',
      },
      county: null,
      municipality: 51,
    },
  ],
};
