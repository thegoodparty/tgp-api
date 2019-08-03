/*

Example input:
 {
  "ocd-division/country:us/state:ca": {
   "name": "California"
  },
  "ocd-division/country:us/state:ca/sldl:46": {
   "name": "California Assembly district 46"
  },
  "ocd-division/country:us/state:ca/sldu:18": {
   "name": "California State Senate district 18"
  }
 }

 Output:
 {
    country: { code: 'us', name: 'California', ocdDivisionId: 'ocd-division/country:us/state:ca' },
    state: { code: 'ca', name: 'California', ocdDivisionId: 'ocd-division/country:us/state:ca' },
    sldl: { code: '46', name: 'California Assembly district 46', ocdDivisionId: 'ocd-division/country:us/state:ca/sldl:46' },
    sldu: { code: '18', name: 'California State Senate district 18', ocdDivisionId: 'ocd-division/country:us/state:ca/sldu:18' },
  }


  sldl = State Lower Legislative District (house)
  sldu - upper (senate)

 */


module.exports = {
  friendlyName: 'OCD Division ID Parser',

  description: 'Converts the ocdDivisionId string into an object',

  inputs: {
    ocdDivisionIds: {
      friendlyName: 'OCD Division Id object',
      type: 'json',
    },
  },

  exits: {
    success: {
      description: 'Returns ok response from api/responses/ok.js',
      responseType: 'ok',
    },
    badRequest: {
      description: 'parse failed',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { ocdDivisionIds } = inputs;
      const divisions = {};
      Object.keys(ocdDivisionIds).map(divKey => {
        const keyParts = divKey.split('/');
        keyParts.map(part => {
          if (part !== 'ocd-division') {
            const partKeyValue = part.split(':');
            if (!divisions[partKeyValue[0]]) {
              divisions[partKeyValue[0]] = {
                code: partKeyValue[1],
                name: ocdDivisionIds[divKey].name,
                ocdDivisionId: divKey
              };
            }
          }
        });
      });
      return exits.success(divisions);
    } catch (e) {
      return exits.badRequest({ message: 'failed to parse divisions' });
    }
  },
};
