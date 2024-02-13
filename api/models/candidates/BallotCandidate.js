/**
 * BallotCandidate.js
 *
 * @description :: Represents a candidate entity in the database.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    first_name: {
      type: 'string',
    },
    last_name: {
      type: 'string',
    },
    state: {
      type: 'string',
    },
    parsed_location: {
      type: 'string',
    },
    normalized_position_name: {
      type: 'string',
    },
    parties: {
      type: 'string',
    },
    email: {
      type: 'string',
      unique: true,
    },
    phone: {
      type: 'string',
      unique: true,
    },
    candidacy_id: {
      type: 'string',
    },
    election_id: {
      type: 'string',
    },
    election_name: {
      type: 'string',
    },
    election_day: {
      type: 'string',
    },
    position_id: {
      type: 'string',
    },
    mtfcc: {
      type: 'string',
    },
    geo_id: {
      type: 'string',
    },
    position_name: {
      type: 'string',
    },
    sub_area_name: {
      type: 'string',
    },
    sub_area_value: {
      type: 'string',
    },
    sub_area_name_secondary: {
      type: 'string',
    },
    sub_area_value_secondary: {
      type: 'string',
    },
    level: {
      type: 'string',
    },
    tier: {
      type: 'string',
    },
    is_judicial: {
      type: 'string',
    },
    is_retention: {
      type: 'string',
    },
    number_of_seats: {
      type: 'string',
    },
    normalized_position_id: {
      type: 'string',
    },
    race_id: {
      type: 'string',
    },
    geofence_id: {
      type: 'string',
    },
    geofence_is_not_exact: {
      type: 'string',
    },
    is_primary: {
      type: 'string',
    },
    is_runoff: {
      type: 'string',
    },
    is_unexpired: {
      type: 'string',
    },
    candidate_id: {
      type: 'string',
    },
    middle_name: {
      type: 'string',
    },
    nickname: {
      type: 'string',
    },
    suffix: {
      type: 'string',
    },
    image_url: {
      type: 'string',
    },
    urls: {
      type: 'string',
    },
    election_result: {
      type: 'string',
    },
    candidacy_created_at: {
      type: 'string',
    },
    candidacy_updated_at: {
      type: 'string',
    },
  },
};
