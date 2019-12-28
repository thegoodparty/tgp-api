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
      console.log('register1');
      const { phone, verify, districtId, addresses } = inputs;
      console.log('register2', phone, verify, districtId, addresses);
      const phoneError = !/^\d{10}$/.test(phone);
      if (phoneError) {
        return exits.badRequest({
          message: 'Accepting 10 digits phone numbers only. EX: 3104445566',
        });
      }
      console.log('register3');

      let displayAddress, normalizedAddress, zip;
      if (addresses) {
        const address = JSON.parse(addresses);
        displayAddress = address.displayAddress;
        normalizedAddress = address.normalizedAddress
          ? JSON.stringify(address.normalizedAddress)
          : null;
        zip = address.zip;
      }
      console.log('register4');
      let zipCode;

      if (zip) {
        zipCode = await ZipCode.findOne({ zip });
      }
      console.log('register5');
      const userAttr = {
        phone,
      };
      console.log('register6');
      if (zipCode) {
        userAttr.zipCode = zipCode.id;
      }
      console.log('register7');
      if (districtId) {
        userAttr.congDistrict = districtId;
      }
      console.log('register8');
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
      console.log('register9');

      if (verify) {
        userAttr.isVerified = false;
      }
      console.log('register10');

      // need to update in case the user was already in the db.
      await User.updateOne({ id: user.id }).set({
        ...userAttr,
        displayAddress,
        normalizedAddress,
      });
      console.log('register11');

      // send sms to the newly created user.
      if (verify) {
        await sails.helpers.smsVerify(`+1${phone}`);
      }
      console.log('register12');
      return exits.success({
        user,
      });
    } catch (e) {
      console.log('register error', JSON.stringify(e));
      if (e.code === 'E_UNIQUE') {
        return exits.badRequest({
          message:
            'This phone is already pledged. Try logging in instead of pledging.',
        });
      } else {
        return exits.badRequest({ message: 'Error registering phone.' });
      }
    }
  },
};
