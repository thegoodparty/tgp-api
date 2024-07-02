module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      let races = await getResults();
      let results = races.edges;
      for (const result of results) {
        await addResult(result);
      }
      let morePages = races.pageInfo.hasNextPage;
      console.log(`more pages: ${morePages}`);
      let i = 0;
      while (morePages) {
        i++;
        const cursor = races.pageInfo.endCursor;
        console.log(`getting page ${i} with cursor ${cursor}`);
        races = await getResults(cursor);
        results = races.edges;
        for (const result of results) {
          await addResult(result);
        }
        morePages = races.pageInfo.hasNextPage;
        console.log(`more pages: ${morePages}`);
      }
    } catch (error) {
      console.log(error);
    }
  },
};

async function addResult(result) {
  console.log(
    `${result.node.position.name} - ${result.node.election.electionDay}`,
  );
  await BallotElectionDate.findOrCreate(
    { positionId: result.node.position.id },
    { electionDay: result.node.election.electionDay },
    {
      positionId: result.node.position.id,
      officeName: result.node.position.name,
      electionDay: result.node.election.electionDay,
      mtfcc: result.node.position.mtfcc,
      geoId: result.node.position.geoId.toString(),
    },
  );
}

async function getResults(cursor) {
  let afterCursor = '';
  if (cursor) {
    afterCursor = `(after: "${cursor}")`;
  }
  const query = `
            query Races {
                races ${afterCursor}{
                    edges {
                        node {
                            election {
                                electionDay
                                id
                            }
                            position {
                                id
                                mtfcc
                                name
                                geoId
                            }
                        }
                        cursor
                    }
                    pageInfo {
                        endCursor
                        hasNextPage
                        hasPreviousPage
                        startCursor
                    }
                }
            }`;

  const { races } = await sails.helpers.graphql.queryHelper(query);
  return races;
}
