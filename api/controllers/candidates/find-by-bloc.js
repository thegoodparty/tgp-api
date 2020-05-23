/**
 * incumbents/find.js
 *
 * @description :: Find a candidate by bloc name
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
  friendlyName: 'Find a candidate by bloc name',

  description:
    'Find a candidate by bloc name. query from shared link in the form of ?b=SmithBloc-KY12.',

  inputs: {
    bloc: {
      type: 'string',
      required: true,
      description: 'query from shared link in the form of ?b=SmithBloc-KY12.',
      example: 'SmithBloc-KY12 or SmithBloc-KY or SmithBloc',
    },
  },

  exits: {
    success: {
      description: 'Candidate Found',
      responseType: 'ok',
    },
    notFound: {
      description: 'Candidate Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { bloc } = inputs;
      const [nameBloc, stateDistrict] = bloc.split('-');
      let lastName = nameBloc.replace('Bloc', '');
      let chamber;
      let state;
      let district;
      if (!stateDistrict) {
        chamber = 'presidential';
        if (lastName === 'Bernie') {
          lastName = 'Sanders';
        }
      } else if (stateDistrict.length === 2) {
        chamber = 'senate';
        state = stateDistrict;
      } else {
        chamber = 'house';
        state = stateDistrict.substring(0, 2);
        district = parseInt(
          stateDistrict.substring(2, stateDistrict.length),
          10,
        );
      }
      if(state){
        state = state.toLowerCase();
      }
      let candidate;
      let criteria = {
        name: { contains: lastName },
        isActive: true,
      };
      if (chamber === 'presidential') {
        candidate = await PresidentialCandidate.findOne(criteria);
      } else {
        const upperChamber = chamber.charAt(0).toUpperCase() + chamber.slice(1);
        criteria.chamber = upperChamber;
        criteria.state = state;
        if (district) {
          criteria.district = district;
        }
        candidate = await RaceCandidate.findOne(criteria);
        if (!candidate) {
          candidate = await Incumbent.findOne(criteria);
          if (candidate) {
            candidate.isIncumbent = true;
          }
        }
      }

      if (!candidate) {
        return exits.notFound();
      }

      return exits.success({
        ...candidate,
      });
    } catch (e) {
      console.log('Error in find incumbent by id', e);
      return exits.notFound();
    }
  },
};
