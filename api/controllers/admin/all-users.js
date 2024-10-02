const moment = require('moment');
module.exports = {
  friendlyName: 'All Users',

  description: 'admin call for getting all users',

  inputs: {
    dateRange: {
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'All Users',
    },

    badRequest: {
      description: 'Error getting users',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { dateRange } = inputs;
      let users = [];
      if (!dateRange || dateRange === 'All time') {
        users = await User.find();
      } else {
        // ['All time', 'last 12 months', 'last 30 days', 'last week']
        let date;
        if (dateRange === 'last 12 months') {
          date = moment().subtract(12, 'months');
        } else if (dateRange === 'last 30 days') {
          date = moment().subtract(30, 'days');
        } else if (dateRange === 'last week') {
          date = moment().subtract(7, 'days');
        }
        const stringDate = date.format('M D, YYYY');

        users = await User.find({
          createdAt: { '>': new Date(stringDate) },
        });
      }

      const campaignVolunteersMapping = await CampaignVolunteer.find({
        user: users.map((user) => user.id),
      }).populate('campaign');

      const campaignsMap = campaignVolunteersMapping.reduce(
        (campaigns, { user: userId, campaign, role }) => {
          const relatedCampaign = {
            ...campaign,
            role,
          };

          return {
            ...campaigns,
            [userId]: campaigns[campaign]
              ? [...campaigns[campaign], relatedCampaign]
              : [relatedCampaign],
          };
        },
        {},
      );

      return exits.success({
        users: users.map((user) => ({
          ...user,
          campaigns: campaignsMap[user.id] || [],
        })),
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error getting users',
      });
    }
  },
};
