module.exports = {
  friendlyName: 'Update Address',

  description: 'update password for a logged in user.',

  inputs: {
    address: {
      description: 'display address',
      example: '123 main street, Los Angeles CA 90210',
      required: true,
      type: 'string',
    },
    addressComponents: {
      description: 'Google autocomplete address components. stringified JSON',
      required: true,
      type: 'string',
    },
    /*
    https://developers.google.com/civic-information/docs/v2/representatives/representativeInfoByAddress
    "normalizedInput": {
      "locationName": string,
      "line1": string,
      "line2": string,
      "line3": string,
      "city": string,
      "state": string,
      "zip": string
    }
     */
    normalizedAddress: {
      description: 'Normalized address from civic api. stringified JSON',
      required: true,
      type: 'string',
    },

    /*
    divisions: {
      "cd": Object {
        "code": "29",
        "name": "California's 29th congressional district",
      },
      "country": Object {
        "code": "us",
        "name": "United States",
      },
      "state": Object {
        "code": "ca",
        "name": "California",
      },
    }
     */
    divisions: {
      description: 'division from civic api. stringified JSON',
      required: true,
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Address successfully updated.',
    },

    badRequest: {
      description: 'Error updating address',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      console.log('update address');
      const user = this.req.user;
      console.log('update address A');
      const {
        address,
        addressComponents,
        normalizedAddress,
        divisions,
      } = inputs;
      console.log('update address B', inputs);
      if (!address || !addressComponents || !normalizedAddress || !divisions) {
        console.log('update address C');
        return exits.badRequest({
          message:
            'Address, addressComponents, normalizedAddress and divisions are required',
        });
      }
      console.log('update address2');
      const divs = JSON.parse(divisions);
      console.log(divs);
      if (!divs || !divs.country || divs.country.code !== 'us') {
        return exits.badRequest({
          message: 'Currently we support only US elections.',
        });
      }
      console.log('update address3', divs.state.name);

      // find or create state and district for user divisions.
      const state = await State.findOrCreate(
        { shortName: divs.state.code },
        {
          name: divs.state.name,
          shortName: divs.state.code,
        },
      );
      console.log('update address4');
      const district = await District.findOrCreate(
        { code: divs.cd.code },
        {
          name: divs.cd.name,
          code: divs.cd.code,
          state: state.id,
        },
      );
      console.log('update address5');

      await User.updateOne({ id: user.id }).set({
        address,
        addressComponents,
        normalizedAddress,
        district: district.id,
      });
      console.log('update address6');

      return exits.success({
        message: 'Address updated',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error saving address',
      });
    }
  },
};
