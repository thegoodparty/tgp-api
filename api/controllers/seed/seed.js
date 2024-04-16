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
      console.log('getting campaings', campaigns.length);
      let csvRows = `campaignId,campaignSlug,candidateName,positionElectionDate,DbElectionDate,ballotLevel,electionName,positionName,partisanType,positionId,electionId,raceId,state,otherOffice<br/>`;

      if (start > campaigns.length) {
        return exits.success('No more campaigns');
      }
      const end = Math.min(start + count, campaigns.length);

      for (let i = start; i < end; i++) {
        const campaign = campaigns[i];
        const positionId = campaign.data?.details?.positionId;
        if (positionId) {
          console.log('positionId', positionId);

          console.log('querying for positionId', positionId);
          const res = await getPrimaryElectionDate(positionId);
          if (res) {
            const { level, partisanType, races, hasPrimary } = res;
            if (hasPrimary) {
              console.log('hasPrimary level', level);
              const positionName = res.name;
              const electionEdges = races.edges;
              console.log('edges count', electionEdges.length);
              for (let i = 0; i < electionEdges.length; i++) {
                const { node } = electionEdges[i];
                const { electionDay, name } = node.election;
                // csvRows += `${level},${name},${partisanType},${electionDay},${state}<br/>`;
                const date = moment(electionDay);
                console.log('date', date);
                if (date > today && date < future) {
                  csvRows += `${campaign?.id},${campaign?.slug},${campaign.data?.name},${electionDay},${campaign?.data?.details?.electionDate},${level},${name},${positionName},${partisanType},${positionId},${campaign?.data?.details?.electionId},${campaign?.data?.details?.raceId},${campaign?.data?.details?.state},${campaign?.data?.details?.otherOffice}<br/>`;
                }
              }
            }
          }
        }
      }

      return exits.success(csvRows);
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
                election {
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
