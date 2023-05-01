// https://developers.hubspot.com/docs/api/crm/contacts
const hubspot = require('@hubspot/api-client');
const moment = require('moment');

const hubSpotToken =
  sails.config.custom.hubSpotToken || sails.config.hubSpotToken;

module.exports = {
  inputs: {
    user: {
      type: 'json',
      required: true,
    },
    loginEvent: {
      type: 'boolean',
    },
  },
  exits: {
    success: {
      description: 'ok',
    },

    badRequest: {
      description: 'Error',
    },
  },
  fn: async function (inputs, exits) {
    if (!hubSpotToken) {
      // for non production env.
      return exits.success('no api key');
    }
    const hubspotClient = new hubspot.Client({ accessToken: hubSpotToken });

    const { user, loginEvent } = inputs;
    const { id, name, email, phone, uuid, zip } = user;
    try {
      // const userCrew = await User.findOne({ id }).populate('crew');
      // const crew = userCrew.crew;
      // crew.sort((a, b) => b.id - a.id);
      // const applicationApproved = await Application.count({
      //   user: id,
      //   status: 'approved',
      // });
      // const applicationDeclined = await Application.count({
      //   user: id,
      //   status: 'rejected',
      // });
      // const applicationSubmitted = await Application.find({
      //   user: id,
      //   status: 'in review',
      // });

      const supports = await Support.find({
        user: id,
      }).sort([{ createdAt: 'DESC' }]);

      let allEndorsements = '';
      for (let i = 0; i < supports.length; i++) {
        const candidate = await Candidate.findOne({
          id: supports[i].candidate,
        });
        allEndorsements += `${candidate.firstName} ${candidate.lastName} \n`;
        supports[i].candidate = candidate;
      }

      const contactObj = {
        properties: {
          firstname: name.split(' ').slice(0, -1).join(' '),
          lastname: name.split(' ').slice(-1).join(' '),
          email,
          phone,
          // type: applicationApproved > 0 ? 'Campaign' : 'User',
          type: 'User',
          source: 'Good Party Site',
          all_endorsements: allEndorsements,
          recent_endorsement:
            supports.length > 0
              ? `${supports[0].candidate.firstName} ${supports[0].candidate.lastName}`
              : '',
          zip,
          referral_link: `https://goodparty.org/?u=${uuid}`,
          // referrals: crew != undefined && crew?.length > 0 ? crew.length : 0,
          // last_referral:
          //   crew.length > 0 ? formatDate(crew[crew.length - 1].createdAt) : '',
          // application_approved: applicationApproved,
          // application_declined: applicationDeclined,
          // application_submitted: applicationSubmitted.length,
          // application_submitted_date:
          //   applicationSubmitted.length > 0
          //     ? formatDate(
          //         applicationSubmitted[applicationSubmitted.length - 1]
          //           .updatedAt,
          //       )
          //     : '',
        },
      };
      if (loginEvent) {
        const now = new Date();
        // this is undocumented, but they want the date in UTC at midnight.
        const todayMidnightUTC = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
        );
        contactObj.properties.last_login = todayMidnightUTC;
      }

      let contactId;
      if (user.metaData) {
        const metaData = JSON.parse(user.metaData);
        if (metaData.hubspotId) {
          contactId = metaData.hubspotId;
        }
      }

      if (!contactId) {
        console.log('getting hubspotId for user', email);
        try {
          const contact = await hubspotClient.crm.contacts.basicApi.getById(
            email,
            ['id', 'email'],
            undefined,
            undefined,
            undefined,
            'email',
          );
          contactId = contact.id;
        } catch (e) {
          // todo: it might be normal for this to fail on first login.
          // so we may want to supress these errors in slack.
          console.log('error getting contact', e);
          await sails.helpers.errorLoggerHelper(
            'Error getting hubspot contact',
            e,
          );
        }
      }

      if (contactId) {
        try {
          await hubspotClient.crm.contacts.basicApi.update(
            contactId,
            contactObj,
          );
        } catch (e) {
          console.log('error updating contact', e);
          await sails.helpers.errorLoggerHelper(
            'Error updating hubspot contact',
            e,
          );
        }
      } else {
        try {
          const createContactResponse =
            await hubspotClient.crm.contacts.basicApi.create(contactObj);
          // update user record with the id from the crm
          const hubspotId = createContactResponse.id;
          await updateMeta(user, hubspotId);
        } catch (e) {
          console.log('error creating contact', e);
          await sails.helpers.errorLoggerHelper(
            'Error creating hubspot contact',
            e,
          );
        }
      }
      return exits.success('ok');
    } catch (e) {
      console.log('error on crm update user helper', e);
      // Error if same phone...
      try {
        if (
          e &&
          e.body &&
          e.body.message.startsWith('Contact already exists.')
        ) {
          const id = e.body.message.substring(
            'Contact already exists. Existing ID: '.length,
          );
          await updateMeta(user, id);
        }
      } catch (err) {
        console.log('error updating meta', err);
      }
      // console.log('hubspot error', e);
      return exits.success('not ok');
    }
  },
};

const updateMeta = async (user, hubspotId) => {
  let metaData;

  if (user.metaData && user.metaData !== '') {
    const parsedMeta = JSON.parse(user.metaData);
    metaData = {
      ...parsedMeta,
      hubspotId,
    };
  } else {
    metaData = { hubspotId };
  }

  await User.updateOne({ id: user.id }).set({
    metaData: JSON.stringify(metaData),
  });
};

const formatDate = (date) => moment(date).format('YYYY-MM-DD');
