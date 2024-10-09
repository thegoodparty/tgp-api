// https://developers.hubspot.com/docs/api/crm/contacts
const { hubspotClient } = require('../../utils/crm/crmClientSingleton');
const { getUserCRMType } = require('../../utils/crm/getUserCRMType');

module.exports = {
  inputs: {
    user: {
      type: 'json',
      required: true,
    },
    loginEvent: {
      type: 'boolean',
    },
    updateEvent: {
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
    try {
      let { user, loginEvent, updateEvent } = inputs;
      user = await User.findOne({ id: user.id });
      const { firstName, lastName, email, phone, uuid, zip } = user;

      const campaign = await sails.helpers.campaign.byUser(user.id);

      const { metaData } = user || {};
      const { accountType, whyBrowsing, demoPersona } = metaData || {};

      let browsing_intent;
      switch (whyBrowsing) {
        case 'considering':
          browsing_intent = 'considering run';
          break;
        case 'learning':
          browsing_intent = 'learning about gp';
          break;
        case 'test':
          browsing_intent = 'testing tools';
          break;
        case 'else':
          browsing_intent = 'other';
          break;
      }

      const contactObj = {
        properties: {
          firstname: firstName,
          lastname: lastName,
          email,
          phone,
          type: await getUserCRMType(user, campaign),
          active_candidate: campaign ? 'Yes' : 'No',
          live_candidate: campaign && campaign?.isActive,
          source: 'GoodParty.org Site',
          zip,
          referral_link: `https://goodparty.org/?u=${uuid}`,
          ...(accountType && campaign?.id
            ? {
                signup_role:
                  accountType === 'browsing' ? accountType : 'running', // Later, once we have campaign staff/volunteer roles, 'helping'
              }
            : {}),
          ...(campaign?.id
            ? {
                product_user: 'yes',
              }
            : {}),
          ...(browsing_intent ? { browsing_intent } : {}),
          ...(demoPersona
            ? {
                demo_selection:
                  demoPersona === 'matthew-mcconaughey' ? 'local' : 'federal',
              }
            : {}),
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
      let profile_updated_count = 0;
      if (user.metaData) {
        const metaData = JSON.parse(user.metaData);
        if (metaData.hubspotId) {
          contactId = metaData.hubspotId;
        }
        if (metaData.profile_updated_count) {
          profile_updated_count = metaData.profile_updated_count;
        }
      }

      if (updateEvent) {
        profile_updated_count += 1;
        const now = new Date();
        // this is undocumented, but they want the date in UTC at midnight.
        const todayMidnightUTC = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
        );
        contactObj.properties.profile_updated_date = todayMidnightUTC;
        contactObj.properties.profile_updated_count = profile_updated_count;
        // update profile_updated_count on user
        let hubspotId = contactId;
        await updateMeta(user, hubspotId, profile_updated_count);
      }

      if (!contactId) {
        try {
          // TODO: abstract these hubspot calls into a separate util so we're not having to do existential checks everywhere for
          //  environments that have HubSpot integration disabled.
          const contact = hubspotClient
            ? await hubspotClient.crm.contacts.basicApi.getById(
                email,
                ['id', 'email'],
                undefined,
                undefined,
                undefined,
                'email',
              )
            : {};
          contactId = contact.id;
          const hubspotId = contactId;
          await updateMeta(user, hubspotId, profile_updated_count);
        } catch (e) {
          // this is not really an error, it just indicates that the user has never filled a form.
          console.log(
            'could not find contact by email. user has never filled a form!',
            e,
          );
        }
      }

      if (contactId) {
        try {
          hubspotClient &&
            (await hubspotClient.crm.contacts.basicApi.update(
              contactId,
              contactObj,
            ));
        } catch (e) {
          console.log('error updating contact', e);
        }
      } else {
        try {
          const createContactResponse = hubspotClient
            ? await hubspotClient.crm.contacts.basicApi.create({
                ...contactObj,
                properties: {
                  ...contactObj.properties,
                  lifecyclestage: 'opportunity',
                },
              })
            : {};
          // update user record with the id from the crm
          const hubspotId = createContactResponse.id;
          await updateMeta(user, hubspotId, profile_updated_count);
        } catch (e) {
          console.log('error creating contact', e);
          // await sails.helpers.slack.errorLoggerHelper(
          //   'Error creating hubspot contact',
          //   e,
          // );
        }
      }
      return exits.success('ok');
    } catch (e) {
      console.log('error on crm update user helper', e);
      await sails.helpers.slack.errorLoggerHelper(
        'error on crm update user helper',
        e,
      );
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
          await updateMeta(user, id, profile_updated_count);
        }
      } catch (err) {
        console.log('error updating meta', err);
        await sails.helpers.slack.errorLoggerHelper(
          'error on crm update user helper2',
          err,
        );
      }
      return exits.success('not ok');
    }
  },
};

async function updateMeta(user, hubspotId, profile_updated_count) {
  let metaData;

  if (user.metaData && user.metaData !== '') {
    const parsedMeta = JSON.parse(user.metaData);
    metaData = {
      ...parsedMeta,
      hubspotId,
      profile_updated_count,
    };
  } else {
    metaData = { hubspotId };
  }

  await User.updateOne({ id: user.id }).set({
    metaData: JSON.stringify(metaData),
  });
}
