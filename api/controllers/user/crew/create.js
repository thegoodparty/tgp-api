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
    referrer: {
      description: 'uuid of the inviting user',
      type: 'string',
      required: false,
    },
    guestUuid: {
      description: 'uuid that was generated on the front end',
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
      const user = this.req.user;
      const { name } = user;
      const { referrer, guestUuid } = inputs;
      const userAttr = {};
      if (referrer) {
        const referrerUser = await User.findOne({ uuid: referrer });
        if (referrerUser) {
          userAttr.referrer = referrerUser.id;
          await User.updateOne({ id: referrerUser.id }).set({
            crewCount: referrerUser.crewCount ? referrerUser.crewCount + 1 : 2,
          });
          await sails.helpers.crm.updateUser(referrerUser);

          const appBase = sails.config.custom.appBase || sails.config.appBase;
          const firstName = name.split(' ')[0];
          const lastName = name.split(' ').length > 0 && name.split(' ')[1];
          const nameString = lastName
            ? `${firstName} ${lastName[0]}.`
            : firstName;
          const subject = `${nameString} has joined your Good Party crowd-voting crew`;
          const message = `<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
            <tbody>
              <tr>
                <td>
                  <p
                    style="
                      font-size: 16px;
                      font-family: Arial, sans-serif;
                      margin-top: 0;
                      margin-bottom: 5px;
                    "
                  >
                    Hi ${referrerUser.firstName ||
                      referrerUser.name}!<br /><br />
                  </p>
                </td>
              </tr>
              <tr>
                <td>
                  <p
                    style="
                      font-size: 16px;
                      font-family: Arial, sans-serif;
                      margin-top: 0;
                      margin-bottom: 5px;
                    "
                  >
                   ${nameString} joined a crowd-voting campaign using a link you shared.  Your endorsement is the powerful reason they joined.  So, thank you!
                  </p>
                </td>
              </tr>
              <tr>
                <td>
                  <p
                    style="
                      font-size: 16px;
                      font-family: Arial, sans-serif;
                      margin-top: 0;
                      margin-bottom: 5px;
                    "
                  >
                    <br/>
                    See how your crew is growing and helping you move up our leaderboards.
                  </p>
                </td>
              </tr>
              <tr>
                <td>
                  <br /><br /><a
                    href="${appBase}/profile/leaderboard"
                    style="
                      padding: 16px 32px;
                      background: linear-gradient(
                          103.63deg,
                          rgba(255, 15, 19, 0.15) -3.51%,
                          rgba(191, 0, 32, 0) 94.72%
                        ),
                        linear-gradient(
                          257.82deg,
                          rgba(67, 0, 211, 0.25) -11.17%,
                          rgba(67, 0, 211, 0) 96.34%
                        ),
                        #5c00c7;
                      color: #fff;
                      font-size: 16px;
                      border-radius: 8px;
                      text-decoration: none;
                    "
                  >
                    SEE YOUR CREW
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
          `;
          const messageHeader = '';
          await sails.helpers.mailgun.mailgunSender(
            referrerUser.email,
            referrerUser.name,
            subject,
            messageHeader,
            message,
          );
        } else {
          // invited by a guest with a referrer (uuid) that was generated on the front end.
          userAttr.guestReferrer = referrer;
        }
      }

      const uuid =
        guestUuid ||
        Math.random()
          .toString(36)
          .substring(2, 12);

      await User.updateOne({ id: user.id }).set(userAttr);

      // find all the users that were invited by this user
      const referredUsers = await User.find({ guestReferrer: uuid });
      for (let i = 0; i < referredUsers.length; i++) {
        const referredUser = referredUsers[i];
        await User.updateOne({ id: referredUser.id }).set({
          referrer: user.id,
          guestReferrer: '',
        });
      }
      //add crewCount from refferedUsers
      if (referredUsers.length > 0) {
        user.crewCount = referredUsers.length;
      }
      await sails.helpers.crm.updateUser(user);

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      // await sails.helpers.errorLoggerHelper('Error at entrance/crew/create', e);
      console.log('Error at entrance/crew/create', e);
      return exits.badRequest({ message: 'Error adding crew' });
    }
  },
};
