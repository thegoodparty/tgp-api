// https://developers.hubspot.com/docs/api/crm/contacts
const hubspot = require('@hubspot/api-client');

const hubSpotKey = sails.config.custom.hubSpotKey || sails.config.hubSpotKey;

module.exports = {
  inputs: {
    user: {
      type: 'json',
      required: true,
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
  fn: async function(inputs, exits) {
    if (!hubSpotKey) {
      // for non production env.
      return exits.success('no api key');
    }
    const hubspotClient = new hubspot.Client({ apiKey: hubSpotKey });

    const { user } = inputs;
    try {
      const userCrew = await User.findOne({ id: user.id }).populate('crew');
      const contactObj = {
        properties: {
          firstname: user.name
            .split(' ')
            .slice(0, -1)
            .join(' '),
          lastname: user.name
            .split(' ')
            .slice(-1)
            .join(' '),
          email: user.email,
          phone: user.phone,
          zip: user.zip,
          referral_link: `https://goodparty.org/?u=${user.uuid}`,
          referrals: userCrew.crew.length,
        },
      };

      // update user record with the id from the crm
      console.log('creating contact...');
      const createContactResponse = await hubspotClient.crm.contacts.basicApi.create(
        contactObj,
      );
      console.log('created', createContactResponse);

      const hubspotId = createContactResponse.id;
      await updateMeta(user, hubspotId);
      return exits.success('ok');
    } catch (e) {
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
          console.log('id from error', id);
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
