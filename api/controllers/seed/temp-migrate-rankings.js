module.exports = {
  friendlyName: 'Seed',

  description: 'seed role',

  inputs: {},

  exits: {
    success: {
      description: 'AllCandidates',
    },

    badRequest: {
      description: 'Error seeding database',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const users = await User.find();
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        console.log(`migrating user ${user.name}`);
        let { presidentialRank, senateRank, houseRank } = user;
        presidentialRank =
          presidentialRank && presidentialRank !== ''
            ? JSON.parse(presidentialRank)
            : [];
        senateRank =
          senateRank && senateRank !== '' ? JSON.parse(senateRank) : [];
        houseRank = houseRank && houseRank !== '' ? JSON.parse(houseRank) : [];

        const senateValues = Object.values(senateRank)[0] || [];
        const houseValues = Object.values(houseRank)[0] || [];
        await migrateChamber(presidentialRank, 'presidential', user);
        await migrateChamber(senateValues, 'senate', user);
        await migrateChamber(houseValues, 'house', user);
      }
      return exits.success({
        seed: `Migrated ${users.length} users`,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error getting candidates' + JSON.stringify(e),
      });
    }
  },
};

const migrateChamber = async (oldRanking, chamber, user) => {
  for (let i = 0; i < oldRanking.length; i++) {
    console.log(
      `migrating chamber ${chamber}, oldRanking: ${oldRanking[i]}, for user: ${user.name}`,
    );
    let candidate;
    if (chamber !== 'presidential') {
      // verify the candidate matches the user district
      candidate = await RaceCandidate.findOne({ id: oldRanking[i] });
      if (
        !candidate ||
        candidate.district !== user.districtNumber ||
        candidate.state !== user.shortState
      ) {
        console.log(
          `continue1: ${
            candidate ? candidate.name : 'no cand'
          }, user district: ${user.districtNumber}`,
        );
        continue;
      }
    } else {
      candidate = await PresidentialCandidate.findOne({ id: oldRanking[i] });
    }

    // don't migrate non good candidates
    let incumbentRaised = 50000000;
    let incumbent;
    if (chamber !== 'presidential') {
      if (candidate.isIncumbent) {
        incumbentRaised = candidate.raised;
        ({ incumbent } = await sails.helpers.incumbentByDistrictHelper());
      } else {
        if (chamber === 'senate') {
          ({ incumbent } = await sails.helpers.incumbentByDistrictHelper(
            candidate.state,
          ));
        } else {
          ({ incumbent } = await sails.helpers.incumbentByDistrictHelper(
            candidate.state,
            candidate.district,
          ));
        }
        incumbentRaised = incumbent
          ? incumbent.raised || incumbent.combinedRaised
          : false;
        incumbentRaised = incumbentRaised ? incumbentRaised / 2 : false;
      }
    }
    const { isGood } = await sails.helpers.goodnessHelper(
      candidate,
      chamber,
      incumbentRaised,
    );

    if (isGood === false) {
      console.log(
        `not migrating non good candidates ranking. candidate: ${candidate.name}`,
      );
      continue;
    }

    await Ranking.create({
      user: user.id,
      chamber,
      candidate: oldRanking[i],
      isIncumbent: false,
      rank: i + 1,
      userState: user.shortState,
    });
  }
};
