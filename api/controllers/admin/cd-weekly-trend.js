const BinaryHeap = require('@tyriar/binary-heap');

const DAY = 24 * 60 * 60 * 1000;
const DISTRICT_LIMIT = 10; // show only the top ten
module.exports = {
  friendlyName: 'CD with Count',

  description: 'Congressional Districts with user count',

  inputs: {},

  fn: async function(inputs, exits) {
    try {
      const now = new Date();
      const lastWeek = new Date(now.getTime() - DAY * 7);
      let userCount;
      let cdWithUserCount;
      let topTrends = [];

      const cds = await CongressionalDistrict.find().populate('state');
      let minTopDistrict;
      // can't use map or forEach because of the await
      for (let i = 0; i < cds.length; i++) {
        userCount = await User.count({
          congressionalDistrict: cds[i].id,
          createdAt: { '>': lastWeek },
        });

        const heap = new BinaryHeap((a, b) => {
          return a.userCount > b.userCount ? 1 : -1;
        });

        cdWithUserCount = { ...cds[i], userCount };
        // enter the first 10 without comparing
        if (i < DISTRICT_LIMIT) {
          heap.insert(cdWithUserCount);
        } else {
          // compare with the top minimum and insert if larger
          minTopDistrict = heap.findMinimum();
          if (userCount > minTopDistrict.userCount) {
            heap.extractMinimum();
            heap.insert(cdWithUserCount);
          }
        }

        let node;

        while (!heap.isEmpty()) {
          node = heap.extractMinimum();
          topTrends.push(node);
        }
        topTrends.reverse();
      }

      return exits.success({
        topTrends,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error getting Districts Trend',
      });
    }
  },
};

// getting the top 10 users. Using a minHeap to compare the value.
// Algorithms and data structure, fool.
function topTen() {
  const heap = new BinaryHeap();
}
