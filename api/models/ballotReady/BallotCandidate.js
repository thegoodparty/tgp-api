/**
 * BallotCandidate.js
 *
 * @description :: Represents a candidate entity in the database.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
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
    data: {
      type: 'json',
    },
    email: {
      // note: a unique sparse index is created in scripts/indexes.js
      type: 'string',
    },
    phone: {
      // note: a unique sparse index is created in scripts/indexes.js
      type: 'string',
    },
    candidateId: {
      // note: a unique sparse index is created in scripts/indexes.js
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
    // many to many relationships
    positions: {
      collection: 'BallotPosition',
      via: 'candidates',
    },
    elections: {
      collection: 'BallotElection',
      via: 'candidates',
    },
    races: {
      collection: 'BallotRace',
      via: 'candidates',
    },
    // one to one relationship
    campaign: {
      model: 'Campaign',
    },
    parties: {
      type: 'string',
    },
    electionName: {
      type: 'string',
    },
    electionDay: {
      type: 'string',
    },
    level: {
      type: 'string',
    },
    tier: {
      type: 'string',
    },
    isJudicial: {
      type: 'string',
    },
    isRetention: {
      type: 'string',
    },
    isPrimary: {
      type: 'string',
    },
    isRunoff: {
      type: 'string',
    },
    isUnexpired: {
      type: 'string',
    },
    electionResult: {
      type: 'string',
    },
  },
};
