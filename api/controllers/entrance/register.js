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

    socialId: {
      type: 'string',
      required: false,
      description: 'Social Channel Id',
    },

    socialProvider: {
      type: 'string',
      required: false,
      description: 'Social Channel',
    },
    socialPic: {
      type: 'string',
      required: false,
      description: 'Social Channel profile image url',
    },
    socialToken: {
      description: 'Social Token that needs to be verified',
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
        presidentialRank,
        senateRank,
        houseRank,
        socialId,
        socialProvider,
        socialPic,
        socialToken,
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
        // districtId wasn't specified - take the first one in the array
        let { approxPctArr } = zipCode;
        if (approxPctArr) {
          approxPctArr = JSON.parse(approxPctArr);
          districtId = approxPctArr[0].districtId;
        }
      }

      if (districtId) {
        const congDistrict = await CongDistrict.findOne({ id: districtId });
        userAttr.congDistrict = districtId;
        userAttr.districtNumber = congDistrict.code;
      }

      if (displayAddress) {
        userAttr.displayAddress = displayAddress;
      }
      if (normalizedAddress) {
        userAttr.normalizedAddress = normalizedAddress;
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
      if (socialId) {
        userAttr.socialId = socialId;
      }
      if (socialProvider) {
        userAttr.socialIProvider = socialProvider;
      }
      if (socialPic) {
        userAttr.avatar = socialPic;
      }
      if (socialPic || socialProvider || socialId) {
        try {
          await sails.helpers.verifySocialToken(
            email,
            socialToken,
            socialProvider,
          );
        } catch (e) {
          return exits.badRequest({
            message: 'Invalid Token',
          });
        }
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

      if (!socialPic && !socialProvider && !socialId) {
        // send sms to the newly created user.
        const appBase = sails.config.custom.appBase || sails.config.appBase;
        const subject = 'Please Confirm your email address - The Good Party';
        const message = `<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
<tr>
                            <td>
                              <h2 style="color: #484848; text-align: left; font-size: 33px;  letter-spacing: 1px; margin-top: 24px; margin-bottom: 24px;">
                                Please confirm your email
                              </h2>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <p style="font-family: Arial, sans-serif; font-size:18px; line-height:26px; color:#484848; margin:0; text-align: left">
                                Hi ${user.name}!,<br/> <br>
                              </p>
                            </td>
                          </tr>
                          
                          <tr>
                            <td>
                                <p style="font-family: Arial, sans-serif; font-size:18px; line-height:26px; color:#484848; margin:0; text-align: left">
                                  Welcome to The Good Party!  Please tap to 
                                  <a href="${appBase}/email-confirmation?email=${email}&token=${user.emailConfToken}">confirm your email</a>, 
                                  so we can get you counted.
                                </p>
                             </td>
                          </tr>
                          <tr>
                            <td>
                              <br/><br/><br/>
                              <a href="${appBase}/email-confirmation?email=${email}&token=${user.emailConfToken}" style="padding: 16px 32px; background-color: #117CB6; color: #FFF; border-radius: 40px; text-decoration: none;">
                                Confirm Email                              
                              </a>
                            </td>
                          </tr>
                        </table>`;
        const messageHeader = '';
        await sails.helpers.mailgunSender(
          email,
          name,
          subject,
          messageHeader,
          message,
        );
      }

      return exits.success({
        user: userWithZip,
      });
    } catch (e) {
      console.log('register error', e);
      return exits.badRequest({ message: 'Error registering account.' });
    }
  },
};
