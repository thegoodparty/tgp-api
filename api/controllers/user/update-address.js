const request = require('request-promise');
module.exports = {
  friendlyName: 'Update Address',

  description: 'update password for a logged in user.',

  inputs: {
    districtId: {
      description: 'Selected district id',
      type: 'number',
    },
    addresses: {
      description: 'Addresses collected from user during account creation.',
      type: 'string',
    },
    zip: {
      description: 'Zip code.',
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
      const user = this.req.user;
      const { addresses, districtId, zip } = inputs;
      if (!addresses && !districtId && !zip) {
        return exits.badRequest({
          message: 'Address, zip or districtId are required',
        });
      }
      let displayAddress, normalizedAddress, addressZip;
      if (addresses) {
        const address = JSON.parse(addresses);
        displayAddress = address.displayAddress;
        normalizedAddress = address.normalizedAddress
          ? JSON.stringify(address.normalizedAddress)
          : address.normalizedAddress;
        addressZip = address.zip;
      }
      let zipCode;

      if (addressZip) {
        zipCode = await ZipCode.findOne({ addressZip });
      } else if (zip) {
        zipCode = await ZipCode.findOne({ zip });
      }

      const userAttr = {};
      if (zipCode) {
        userAttr.zipCode = zipCode.id;
      }
      if (districtId) {
        userAttr.congDistrict = districtId;
      }
      if (displayAddress) {
        userAttr.displayAddress = displayAddress;
      }
      if (normalizedAddress) {
        userAttr.normalizedAddress = normalizedAddress;
      }

      const updatedUser = await User.updateOne({ id: user.id }).set({
        ...userAttr,
      });

      const updatedZipCode = await ZipCode.findOne({
        id: user.zipCode,
      }).populate('cds');
      updatedUser.zipCode = updatedZipCode;

      return exits.success({
        user: updatedUser,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error saving address',
      });
    }
  },
};

const civicApiDistrict = async address => {
  const googleApiKey =
    sails.config.custom.googleApiKey || sails.config.googleApiKey;
  const options = {
    uri: `https://www.googleapis.com/civicinfo/v2/representatives?key=${googleApiKey}&address=${encodeURI(
      address.replace(/,/g, ''),
    )}&includeOffices=false`,
    json: true,
  };

  try {
    const civicResponse = await request(options);
    const keys = Object.keys(civicResponse.divisions);
    const district = {
      //format: https://developers.google.com/civic-information/docs/v2/representatives/representativeInfoByAddress
      normalizedAddress: civicResponse.normalizedInput,

      ocdDivisionId: keys[keys.length - 1],
    };

    const divisions = await sails.helpers.ocdDivisionParser(
      civicResponse.divisions,
    );

    district.divisions = divisions;
    return district;
  } catch (err) {
    console.log(err);
  }
};

//301 Studdard Dr, Clanton, AL 35045
