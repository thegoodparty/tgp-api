/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'register user',

  description: 'register a user with email, password first and last name',

  inputs: {
    phone: {
      description: 'User Phone',
      type: 'string',
      required: true,
    },
    verify: {
      description: 'Should verify phone via sms? ',
      type: 'boolean',
      defaultsTo: true,
    },
    districtId: {
      description: 'Selected district id',
      type: 'number',
    },
    addresses: {
      description: 'Addresses collected from user during account creation.',
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'User Created',
      responseType: 'ok',
    },
    badRequest: {
      description: 'register Failed',
      responseType: 'badRequest',
    },
  },
  fn: async function(inputs, exits) {
    // Look up the user whose ID was specified in the request.
    // Note that we don't have to validate that `userId` is a number;
    // the machine runner does this for us and returns `badRequest`
    // if validation fails.
    try {
      const { phone, verify, districtId, addresses } = inputs;
      const phoneError = !/^\d{10}$/.test(phone);
      if (phoneError) {
        return exits.badRequest({
          message: 'Accepting 10 digits phone numbers only. EX: 3104445566',
        });
      }

      let displayAddress, normalizedAddress, zip;
      if (addresses) {
        const address = JSON.parse(addresses);
        displayAddress = address.displayAddress;
        normalizedAddress = address.normalizedAddress
          ? JSON.stringify(address.normalizedAddress)
          : address.normalizedAddress;
        zip = address.zip;
      }
      let zipCode;

      if (zip) {
        zipCode = await ZipCode.findOne({ zip });
      }
      const userAttr = {
        phone,
      };
      if (zipCode) {
        userAttr.zipCode = zipCode.id;
      }
      if (districtId) {
        userAttr.congDistrict = districtId;
      }
      const user = await User.findOrCreate(
        {
          phone,
        },
        {
          ...userAttr,
          displayAddress,
          normalizedAddress,
        },
      );

      if (verify) {
        userAttr.isVerified = false;
      }

      // need to update in case the user was already in the db.
      await User.updateOne({ id: user.id }).set({
        ...userAttr,
        displayAddress,
        normalizedAddress,
      });

      // send sms to the newly created user.
      if (verify) {
        await sails.helpers.smsVerify(`+1${phone}`);
      }

      const userWithZip = await User.findOne({ id: user.id })
        .populate('zipCode')
        .populate('congDistrict');
      return exits.success({
        user: userWithZip,
      });
    } catch (e) {
      console.log('register error', JSON.stringify(e));
      return exits.badRequest({ message: 'Error registering account.' });
    }
  },
};
