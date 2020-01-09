/**
 * user/crew-member.js
 *
 * @description :: Return a user profile of a crew member
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
  friendlyName: 'Get Crew Member',

  description: 'Return a user profile of a crew member',

  inputs: {
    id: {
      description: 'User id',
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Crew member Found.',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error finding crew member',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { id } = inputs;
      const dbUser = await User.findOne({ id, isPhoneVerified: true })
        .populate('congDistrict')
        .populate('zipCode')
        .populate('recruits');

      const crewMembers = [];
      let user = {};
      if (dbUser) {
        user = {
          id: dbUser.id,
          congDistrict: dbUser.congDistrict,
          image: dbUser.avatar,
          feedback: dbUser.feedback,
          name: dbUser.name,
          recruits: dbUser.recruits ? dbUser.recruits.length : 0,
          zipCode: dbUser.zipCode,
        };

        // get user crew
        if (dbUser.crew && dbUser.crew != '') {
          const crew = JSON.parse(dbUser.crew);

          const crews = await User.find({ id: crew })
            .populate('congDistrict')
            .populate('zipCode')
            .populate('recruits');

          for (let i = 0; i < crews.length; i++) {
            const crewMember = crews[i];
            crewMembers.push({
              id: crewMember.id,
              congDistrict: crewMember.congDistrict,
              image: crewMember.avatar,
              feedback: crewMember.feedback,
              name: crewMember.name,
              recruits: crewMember.recruits ? crewMember.recruits.length : 0,
              zipCode: crewMember.zipCode,
            });
          }
        }
      }

      return exits.success({
        crewMember: user,
        crewMemberCrew: crewMembers,
      });
    } catch (e) {
      console.log('error at get crew member');
      console.log(e);
      return exits.badRequest({
        message: 'Error getting crew member',
      });
    }
  },
};

const fullFirstLastInitials = name => {
  if (!name || typeof name !== 'string') {
    return '';
  }
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0]} ${names[names.length - 1].charAt(0)}`;
  }
  if (names.length === 1) {
    return names[0];
  }
  return '';
};
