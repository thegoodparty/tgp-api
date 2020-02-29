/**
 * user/register.js
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
      const { email, name, verify, districtId, addresses } = inputs;

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
        email,
        name,
      };
      if (zipCode) {
        userAttr.zipCode = zipCode.id;
      }
      if (districtId) {
        userAttr.congDistrict = districtId;
      }
      const user = await User.findOrCreate(
        {
          email,
        },
        {
          ...userAttr,
          displayAddress,
          normalizedAddress,
        },
      );

      if (verify) {
        userAttr.isEmailVerified = false;
      }

      // need to update in case the user was already in the db.
      await User.updateOne({ id: user.id }).set({
        ...userAttr,
        displayAddress,
        normalizedAddress,
      });

      // send sms to the newly created user.
      if (verify) {
        const subject = `Please Confirm your email address - The Good Party`;
        const message = `Hi ${name},<br/> <br/>
                         Welcome to The Good Party! In order to get counted, you need to confirm your email address. <br/> <br/>
                         <a href="https://dev.thegoodparty.org/email-confirmation?token=${user.emailConfToken}">Confirm Email</a>`;
        const messageHeader = 'Please confirm your email';
        await sails.helpers.mailgunSender(
          email,
          name,
          subject,
          messageHeader,
          message,
        );
      }

      // const userWithZip = await User.findOne({ id: user.id })
      //   .populate('zipCode')
      //   .populate('congDistrict');
      return exits.success({
        user,
      });
    } catch (e) {
      console.log('register error', JSON.stringify(e));
      return exits.badRequest({ message: 'Error registering account.' });
    }
  },
};

const sendEmail = async (name, email) => {
  // Import `util`.
  var util = require('util');

  // Import `mailgun` and `mailcomposer`
  var Mailgun = require('mailgun-js');
  var mailcomposer = require('mailcomposer');

  var mailgun = Mailgun({
    apiKey: sails.config.custom.mailgunApiKey,
    domain: 'www.thegoodparty.org',
  });
};
