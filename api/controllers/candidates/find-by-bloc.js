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
      if (state) {
        state = state.toLowerCase();
      }
      let candidate;
      let blocCriteria = {
        blocName: lastName,
        isActive: true,
      };
      let nameCriteria = {
        name: { contains: lastName },
        isActive: true,
      };
      if (chamber === 'presidential') {
        candidate = await PresidentialCandidate.findOne(blocCriteria);
        if (!candidate) {
          candidate = await PresidentialCandidate.findOne(nameCriteria);
        }
      } else {
        const upperChamber = chamber.charAt(0).toUpperCase() + chamber.slice(1);
        nameCriteria.chamber = upperChamber;
        nameCriteria.state = state;
        if (district) {
          nameCriteria.district = district;
          blocCriteria.district = district;
        }
        blocCriteria.chamber = upperChamber;
        blocCriteria.state = state;

        candidate = await RaceCandidate.findOne(blocCriteria);
        if (!candidate) {
          candidate = await Incumbent.findOne(blocCriteria);
          if (!candidate) {
            candidate = await RaceCandidate.findOne(nameCriteria);
            if (!candidate) {
              candidate = await Incumbent.findOne(nameCriteria);
              if (candidate) {
                candidate.isIncumbent = true;
              }
            }
          }
        }
      }

      if (!candidate) {
        return exits.notFound();
      }

      return exits.success({
        id: candidate.id,
        name: candidate.name,
      });
    } catch (e) {
      await sails.helpers.errorLoggerHelper(
        'Error at candidates/find-by-bloc',
        e,
      );
      console.log('Error in find by bloc', e);
      return exits.notFound();
    }
  },
};
