module.exports = {
  inputs: {
    cursor: {
      type: 'string',
    },
  },

  exits: {},

  async fn(inputs, exits) {
    await sails.helpers.slack.errorLoggerHelper(
      'starting to load dates for position elections',
      {},
    );
    const { cursor } = inputs;
    let hasNextPage = true;
    let nextCursor = cursor;
    let totalPages = 0;

    try {
      while (hasNextPage) {
        const pageInfo = await queryPage(nextCursor);
        await sails.helpers.slack.errorLoggerHelper(
          `completed loading ${nextCursor}. continuing with`,
          { pageInfo },
        );
        console.log(
          `completed loading ${nextCursor}. continuing with ${pageInfo.endCursor}`,
        );
        hasNextPage = pageInfo.hasNextPage;
        nextCursor = pageInfo.endCursor;
        totalPages += 1;
        await sleep(500);
      }

      await sails.helpers.slack.errorLoggerHelper(
        `completed loading all position election dates. Total pages: ${totalPages}`,
        { totalPages },
      );
      return exits.success({
        totalPages,
      });
    } catch (e) {
      console.log('Error in position election dates', e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error in seed position election dated',
        e,
        nextCursor,
      );
      return exits.success({
        message: 'Error in position election dates',
        e,
        error: JSON.stringify(e),
      });
    }
  },
};

async function queryPage(nextCursor) {
  const query = `
      query Races {
        races( filterBy: { electionDay: { lt: "2025-01-01" } } ${
          nextCursor ? `, after: "${nextCursor}"` : ''
        }){
            edges {
                node {
                    election {
                        electionDay
                        id
                    }
                    position {
                        id
                    }
                    id
                    isPartisan
                    isPrimary
                    isRunoff
                    isUnexpired   
                }
            }
            pageInfo {
                endCursor
                hasNextPage
                hasPreviousPage
                startCursor
            }
        }
    }
    `;

  const { races } = await sails.helpers.graphql.queryHelper(query);

  const results = races.edges;
  const pageInfo = races.pageInfo;

  for (let i = 0; i < results.length; i++) {
    try {
      const result = results[i].node;
      const { election, position } = result;

      console.log({
        electionDay: election.electionDay,
        electionId: election.id,
        isPartisan: result.isPartisan,
        isPrimary: result.isPrimary,
        isRunoff: result.isRunoff,
        isUnexpired: result.isUnexpired,
        raceId: result.id,
      });
      const ballotPosition = await BallotPosition.findOne({
        select: ['electionDates'],
        where: { ballotHashId: position.id },
      });
      if (!ballotPosition) {
        console.log('BallotPosition not found');
        continue;
      }
      const electionDates = ballotPosition.electionDates || [];
      electionDates.push({
        electionDay: election.electionDay,
        electionId: election.id,
        isPartisan: result.isPartisan,
        isPrimary: result.isPrimary,
        isRunoff: result.isRunoff,
        isUnexpired: result.isUnexpired,
        raceId: result.id,
      });
      await BallotPosition.updateOne({ id: ballotPosition.id }).set({
        electionDates,
      });
    } catch (e) {
      console.log('Error updating a position election dated', e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error updating a position election dated',
        e,
        nextCursor,
        pageInfo,
      );
    }
  }
  return pageInfo;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
