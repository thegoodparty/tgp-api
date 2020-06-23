module.exports = {
  friendlyName: 'Electors By State Helper',

  description: 'Get electors by state',

  inputs: {
    state: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Electors',
    },

    badRequest: {
      description: 'Invalid State',
    },
  },

  fn: async function(inputs, exits) {
    let { state } = inputs;
    state = state.toUpperCase();

    return exits.success({ electors: electors[state] });
  },
};

const electors = {
  AL: 9,
  AK: 3,
  AZ: 11,
  AR: 6,
  CA: 55,
  CO: 9,
  CT: 7,
  DE: 3,
  FL: 29,
  GA: 16,
  HI: 4,
  ID: 4,
  IL: 20,
  IN: 11,
  IA: 6,
  KS: 6,
  KY: 8,
  LA: 8,
  ME: 4,
  MD: 10,
  MA: 11,
  MI: 16,
  MN: 10,
  MS: 6,
  MO: 10,
  MT: 3,
  NE: 5,
  NV: 6,
  NH: 4,
  NJ: 14,
  NM: 5,
  NY: 29,
  NC: 15,
  ND: 3,
  OH: 18,
  OK: 7,
  OR: 7,
  PA: 20,
  RI: 4,
  SC: 9,
  SD: 3,
  TN: 11,
  TX: 38,
  UT: 6,
  VT: 3,
  VA: 13,
  WA: 12,
  WV: 5,
  WI: 10,
  WY: 3,
};
