const { truncateZip } = require('../../utils/truncateZip');
module.exports = {
  inputs: {
    zip: {
      type: 'string',
      required: true,
      minLength: 5,
      maxLength: 5,
    },
  },

  exits: {},

  async fn(inputs, exits) {
    try {
      const { zip } = inputs;

      const query = `
      query {
        positions(
          location: {
            zip: "${truncateZip(zip)}"
          }
          filterBy: {
            electionDay: {
              gt: "2023-10-29"
              lt: "2025-01-01"
            }
            mtfcc: "G4110"
            level: CITY
          }
        ) {
          edges {
            node {
              name
              state
              subAreaName
              description
              level
              partisanType
              employmentType
              salary
              eligibilityRequirements
              filingAddress
              filingPhone
              filingRequirements
              paperworkInstructions
              electionFrequencies {
                frequency
              }
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
      }


      `;

      const { positions } = await sails.helpers.graphql.queryHelper(query);

      const results = positions.edges;
      let output = [];

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const {
          name,
          state,
          subAreaName,
          description,
          level,
          partisanType,
          employmentType,
          salary,
          eligibilityRequirements,
          filingAddress,
          filingPhone,
          filingRequirements,
          paperworkInstructions,
          electionFrequencies,
          races,
        } = result.node;

        let frequency = '';
        if (electionFrequencies && electionFrequencies.length > 0) {
          frequency = electionFrequencies[0].frequency[0];
        }
        let electionDate = '';
        if (races && races.edges.length > 0) {
          races.edges.forEach((edge, index) => {
            electionDate += edge.node.election.electionDay;
            if (index < races.edges.length - 1) {
              electionDate += ' | ';
            }
          });
        }
        output.push(
          `${state} ${subAreaName || ''}; ${cleanField(name)}; ${cleanField(
            description,
          )}; ${level}; ${cleanField(partisanType)}; ${cleanField(
            employmentType,
          )}; ${salary}; ${cleanField(eligibilityRequirements)}; ${cleanField(
            filingAddress,
          )}; ${filingPhone}; ${cleanField(filingRequirements)}; ${cleanField(
            paperworkInstructions,
          )}; ${frequency}; ${electionDate}`,
        );
      }
      return exits.success({
        output,
      });
    } catch (e) {
      console.log('Error in ballot ready', e);
      return exits.success({
        message: 'Error in ballotready',
        e,
        error: JSON.stringify(e),
      });
    }
  },
};

function cleanField(field) {
  if (!field) {
    return '';
  }
  return field.replace(/;/g, '.');
}
