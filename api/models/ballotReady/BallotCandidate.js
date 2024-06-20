/**
 * BallotCandidate.js
 *
 * @description :: Represents a candidate entity in the database.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    slug: {
      type: 'string',
      required: true,
      unique: true,
    },
    brCandidateId: {
      // note: a unique sparse index is created in scripts/indexes.js
      type: 'string',
    },

    bpCandidateId: {
      // note: a unique sparse index is created in scripts/indexes.js
      type: 'string',
    },

    firstName: {
      type: 'string',
      required: true,
    },
    middleName: {
      type: 'string',
    },
    lastName: {
      type: 'string',
    },
    state: {
      type: 'string',
    },
    parsedLocation: {
      type: 'string',
    },
    positionName: {
      type: 'string',
    },
    normalizedPositionName: {
      type: 'string',
    },

    email: {
      // note: a unique sparse index is created in scripts/indexes.js
      type: 'string',
    },
    phone: {
      // note: a unique sparse index is created in scripts/indexes.js
      type: 'string',
    },
    vendorTsPhone: {
      // note: a unique sparse index is created in scripts/indexes.js
      type: 'string',
    },
    vendorTsEmail: {
      // note: a unique sparse index is created in scripts/indexes.js
      type: 'string',
    },

    ballotHashId: {
      type: 'string',
    },

    raceId: {
      type: 'string',
    },
    positionId: {
      type: 'string',
    },
    electionId: {
      type: 'string',
    },

    party: {
      type: 'string',
    },
    electionName: {
      type: 'string',
    },
    electionDay: {
      type: 'string',
    },
    electionResult: {
      type: 'string',
    },
    level: {
      type: 'string',
    },
    tier: {
      type: 'string',
    },
    isJudicial: {
      type: 'boolean',
    },
    isRetention: {
      type: 'boolean',
    },
    isPrimary: {
      type: 'boolean',
    },
    isRunoff: {
      type: 'boolean',
    },
    isUnexpired: {
      type: 'boolean',
    },

    brData: {
      type: 'json',
    },

    brCandidacyData: {
      type: 'json',
    },

    p2vData: {
      type: 'json',
    },

    bpData: {
      type: 'json',
    },
    vendorTsData: {
      type: 'json',
    },

    // cached data from position, election etc. to prevent joins for SEO pages.
    presentationData: {
      type: 'json',
    },

    // many to many relationships

    races: {
      collection: 'BallotRace',
      via: 'candidates',
    },
    positions: {
      collection: 'BallotPosition',
      via: 'candidates',
    },
    elections: {
      collection: 'BallotElection',
      via: 'candidates',
    },
    // one to one relationship
    campaign: {
      model: 'Campaign',
    },
  },
};
