/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  friendlyName: 'Find Candidate associated with user',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
    email: {
      type: 'string',
      required: true,
    },
    role: {
      type: 'string',
      required: true,
      isIn: ['staff', 'manager'],
    },
  },

  exits: {
    success: {
      description: 'Created',
      responseType: 'ok',
    },
    notFound: {
      description: 'Error creating.',
      responseType: 'notFound',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { id, email, role } = inputs;
      const user = this.req.user;

      const candidate = await Candidate.findOne({ id });
      const canAccess = await sails.helpers.staff.canAccess(candidate, user);
      if (!canAccess) {
        return exits.forbidden();
      }

      const invitedUser = await User.findOne({ email });
      if (invitedUser) {
        const isExisting = await Staff.findOne({
          user: invitedUser.id,
          candidate: id,
        });
        if (isExisting) {
          return exits.badRequest({
            message: 'Staff member already exist for this user',
          });
        }
        console.log('invitedUser', invitedUser);
        await Staff.create({
          role,
          user: invitedUser.id,
          candidate: id,
          createdBy: user.id,
        });
      } else {
        // send invitation
        console.log('no user');
      }

      return exits.success({
        message: 'created',
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.badRequest();
    }
  },
};
