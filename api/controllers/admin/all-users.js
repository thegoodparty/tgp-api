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

  fn: async function(inputs, exits) {
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
        console.log('stringDate', stringDate);

        users = await User.find({
          createdAt: { '>': new Date(stringDate) },
        });
      }
      return exits.success({
        users,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error getting users',
      });
    }
  },
};
