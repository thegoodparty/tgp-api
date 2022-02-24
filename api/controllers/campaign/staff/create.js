/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const appBase = sails.config.custom.appBase || sails.config.appBase;
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
      isEmail: true,
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
    badRequest: {
      description: 'Login Error',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { id, email, role } = inputs;
      const lowerCaseEmail = email.toLowerCase();
      const user = this.req.user;

      const candidate = await Candidate.findOne({ id });
      const canAccess = await sails.helpers.staff.canAccess(candidate, user);
      if (!canAccess || canAccess === 'staff') {
        return exits.forbidden();
      }

      const invitedUser = await User.findOne({ email: lowerCaseEmail });
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
        await Staff.create({
          role,
          user: invitedUser.id,
          candidate: id,
          createdBy: user.id,
        });
      } else {
        // send invitation

        await StaffInvitation.create({
          role,
          email: lowerCaseEmail,
          candidate: id,
          createdBy: user.id,
        });

        const candidateName = `${candidate.firstName} ${candidate.lastName}`;
        const roleName = role === 'staff' ? 'staff member' : 'campaign manager';
        const content = {
          role: roleName,
          candidateName,
          user: user.name,
          link: `${appBase}/register?email=${lowerCaseEmail}`,
        };

        const to = lowerCaseEmail;
        const subject = `You were invited to be a ${roleName} for ${candidateName} at Good Party`;
        const template = 'staff-invitation';

        const variables = JSON.stringify(content);
        await sails.helpers.mailgun.mailgunTemplateSender(
          to,
          subject,
          template,
          variables,
        );
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
