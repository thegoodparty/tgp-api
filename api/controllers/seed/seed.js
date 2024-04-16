const moment = require('moment');

const today = moment();
const future = moment().add(1, 'year');

module.exports = {
  inputs: {
    start: {
      type: 'number',
    },
    count: {
      type: 'number',
    },
  },

  exits: {},

  async fn(inputs, exits) {
    try {
      const { start, count } = inputs;
      const campaigns = await Campaign.find({ isActive: true });
      if (start > campaigns.length) {
        return exits.success('No more campaigns');
      }
      const end = Math.min(start + count, campaigns.length);

      for (let i = start; i < end; i++) {
        const campaign = campaigns[i];
        console.log('campaign', campaign.slug);
        const positionId = campaign.data?.details?.positionId;
        if (positionId) {
          console.log('positionId', positionId);

          console.log('querying for positionId', positionId);
          const res = await getPrimaryElectionDate(positionId);
          if (res) {
            const { partisanType, races, hasPrimary } = res;
            console.log('partisanType', partisanType);
            console.log('hasPrimary', hasPrimary);

            if (hasPrimary && partisanType === 'nonpartisan') {
              console.log('hasPrimary level');
              const electionEdges = races.edges;
              console.log('edges count', electionEdges.length);
              for (let i = 0; i < electionEdges.length; i++) {
                const { node } = electionEdges[i];
                const { isPrimary } = node;
                console.log('isPrimary', isPrimary);
                if (!isPrimary) {
                  continue;
                }
                const { electionDay, id } = node.election;
                const date = moment(electionDay);
                console.log('date', date);
                if (date > today && date < future) {
                  console.log('found primary date', electionDay);
                  await Campaign.updateOne({ id: campaign.id }).set({
                    data: {
                      ...campaign.data,
                      details: {
                        ...campaign.data.details,
                        primaryElectionDate: electionDay,
                        electionDay: campaign.data?.goals?.electionDay,
                        primaryElectionId: id,
                      },
                    },
                  });
                }
              }
            }
          }
        }
      }

      return exits.success('Done');
    } catch (e) {
      console.log('Error in seed', e);
      return exits.success({
        message: 'Error in seed',
        e,
        error: JSON.stringify(e),
      });
    }
  },
};

async function getPrimaryElectionDate(positionId) {
  const query = `
  query Node {
    node(id: "${positionId}") {
        ... on Position {
          hasPrimary
          level
          name
          partisanType
          races {            
            edges {
              node {
                isPrimary
                election {
                  id
                  electionDay
                  name
                  
                }
              }
            
            }
          }
        }
    }
}
`;
  const { node } = await sails.helpers.graphql.queryHelper(query);
  return node;
}
