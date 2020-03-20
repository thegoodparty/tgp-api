/**
 * entrance/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'register user',

  description: 'register a user with email and name',

  inputs: {
    email: {
      description: 'User Email',
      type: 'string',
      required: true,
      isEmail: true,
    },

    name: {
      description: 'User Name',
      type: 'string',
      required: true,
    },
    verify: {
      description: 'Send an email?',
      type: 'boolean',
      defaultsTo: true,
      required: false,
    },
    districtId: {
      description: 'Selected district id',
      type: 'number',
      required: false,
    },
    addresses: {
      description: 'Addresses collected from user during account creation.',
      type: 'string',
      required: false,
    },
    zip: {
      description: 'zip collected from user during account creation.',
      type: 'string',
      required: false,
    },
    feedback: {
      description: 'Message from the user',
      type: 'string',
      required: false,
    },
    presidentialRank: {
      description: 'stringified array of presidential candidates IDs',
      type: 'string',
      required: false,
    },
    senateRank: {
      description: 'stringified array of senate candidates IDs',
      type: 'string',
      required: false,
    },
    houseRank: {
      description: 'stringified array of house candidates IDs',
      type: 'string',
      required: false,
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
      const {
        email,
        name,
        verify,
        addresses,
        zip,
        feedback,
        presidentialRank,
        senateRank,
        houseRank,
      } = inputs;

      let { districtId } = inputs;

      const userExists = await User.findOne({
        email,
      });
      if (userExists) {
        return exits.badRequest({
          message: `${email} already exists in our system.`,
          exists: true,
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

      const userAttr = {
        email,
        name,
      };
      if (zipCode) {
        userAttr.zipCode = zipCode.id;
        userAttr.shortState = zipCode.stateShort;
      }
      if (zipCode && !districtId) {
        console.log('here1', zipCode);
        // districtId wasn't specified - take the first one in the array
        let { approxPctArr } = zipCode;
        console.log('here2', approxPctArr);
        if (approxPctArr) {
          console.log('here3');
          approxPctArr = JSON.parse(approxPctArr);
          console.log('here4', approxPctArr);
          districtId = approxPctArr[0].districtId;
          console.log('here5', districtId);
        }
      }

      if (districtId) {
        console.log('districtID1', districtId);
        const congDistrict = await CongDistrict.findOne({ id: districtId });
        userAttr.congDistrict = districtId;
        userAttr.districtNumber = congDistrict.code;
        console.log('districtID2', congDistrict.code);
      }

      if (displayAddress) {
        userAttr.displayAddress = displayAddress;
      }
      if (normalizedAddress) {
        userAttr.normalizedAddress = normalizedAddress;
      }
      if (feedback) {
        userAttr.feedback = feedback;
      }
      if (presidentialRank) {
        userAttr.presidentialRank = presidentialRank;
      }
      if (senateRank) {
        userAttr.senateRank = senateRank;
      }
      if (houseRank) {
        userAttr.houseRank = houseRank;
      }
      if (verify) {
        userAttr.isEmailVerified = false;
      }

      const user = await User.create({
        ...userAttr,
      }).fetch();

      // need to update in case the user was already in the db.
      await User.updateOne({ id: user.id }).set({
        ...userAttr,
      });

      const userWithZip = await User.findOne({ id: user.id });

      const userZipCode = await ZipCode.findOne({
        id: userWithZip.zipCode,
      }).populate('cds');
      userWithZip.zipCode = userZipCode;

      // send sms to the newly created user.
      const appBase = sails.config.custom.appBase || sails.config.appBase;
      const subject = 'Please Confirm your email address - The Good Party';
      const message = `Hi ${name},<br/> <br/>
                         Welcome to The Good Party! In order to get counted, you need to confirm your email address. <br/> <br/>
                         <a href="${appBase}/email-confirmation?email=${email}&token=${user.emailConfToken}">Confirm Email</a>`;
      const messageHeader = 'Please confirm your email';
      await sails.helpers.mailgunSender(
        email,
        name,
        subject,
        messageHeader,
        message,
      );

      return exits.success({
        user: userWithZip,
      });
    } catch (e) {
      console.log('register error', e);
      return exits.badRequest({ message: 'Error registering account.' });
    }
  },
};
