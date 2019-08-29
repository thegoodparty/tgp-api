const BinaryHeap = require('@tyriar/binary-heap');

const DAY = 24 * 60 * 60 * 1000;
const DISTRICT_LIMIT = 10; // show only the top ten
module.exports = {
  friendlyName: 'Senate with Count',

  description: 'Senate Districts with user count',

  inputs: {},

  fn: async function(inputs, exits) {
    try {
      const now = new Date();
      const lastWeek = new Date(now.getTime() - DAY * 7);
      let userCount;
      let senateWithUserCount;
      let topTrends = [];

      const senates = await SenateDistrict.find().populate('state');
      let minTopDistrict;
      // can't use map or forEach because of the await
      for (let i = 0; i < senates.length; i++) {
        userCount = await User.count({
          senateDistrict: senates[i].id,
          createdAt: { '>': lastWeek },
        });

        const heap = new BinaryHeap((a, b) => {
          return a.userCount > b.userCount ? 1 : -1;
        });

        senateWithUserCount = { ...senates[i], userCount };
        // enter the first 10 without comparing
        if (i < DISTRICT_LIMIT) {
          heap.insert(senateWithUserCount);
        } else {
          // compare with the top minimum and insert if larger
          minTopDistrict = heap.findMinimum();
          if (userCount > minTopDistrict.userCount) {
            heap.extractMinimum();
            heap.insert(senateWithUserCount);
          }
        }

        let node;

        while (!heap.isEmpty()) {
          node = heap.extractMinimum();
          topTrends.push(node.key);
        }
        topTrends.reverse();
      }

      return exits.success({
        senateWeeklyTrend: topTrends,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error getting Districts Trend',
      });
    }
  },
};

