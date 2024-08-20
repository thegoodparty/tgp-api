const slugify = require('slugify');
const { hubspotClient } = require('../../utils/crm/crmClientSingleton');

module.exports = {
  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'ok',
    },

    badRequest: {
      description: 'Error',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const { id } = inputs;
      const candidate = await BallotCandidate.findOne({
        where: { id, p2vData: { '!=': null } },
      });
      if (!candidate) {
        return exits.success('no candidate found');
      }
      if (!candidate.email) {
        return exits.success('candidate has no email');
      }

      const { email, p2vData, firstName, lastName, positionName } = candidate;
      const slug = `${slugify(`${firstName}-${lastName}`, {
        lower: true,
      })}/${slugify(positionName, { lower: true })}`;
      const {
        totalRegisteredVoters,
        republicans,
        democrats,
        indies,
        averageTurnout,
        projectedTurnout,
        winNumber,
        voterContactGoal,
      } = p2vData;

      const contactObj = {
        properties: {
          email,
          win_number: winNumber,
          democrat_voters: democrats,
          republican_voters: republicans,
          independent_voters: indies,
          total_voters: totalRegisteredVoters,
          average_turnout: averageTurnout,
          projected_turnout: projectedTurnout,
          voter_contact_goal: voterContactGoal,
          candidate_page_url: `https://goodparty.org/candidate/${slug}`,
        },
      };

      let contactId;

      try {
        const contact = await hubspotClient.crm.contacts.basicApi.getById(
          email,
          ['id', 'email'],
          undefined,
          undefined,
          undefined,
          'email',
        );
        contactId = contact.id;
      } catch (e) {
        // this is not really an error, it just indicates that the user has never filled a form.
        console.log('could not find contact by email.', e);
        await sails.helpers.slack.errorLoggerHelper(
          'could not find contact by email.',
          e,
        );
        return exits.success('no hubspot contact found');
      }

      if (contactId) {
        try {
          await hubspotClient.crm.contacts.basicApi.update(
            contactId,
            contactObj,
          );
        } catch (e) {
          console.log('error updating contact', e);
          await sails.helpers.slack.errorLoggerHelper(
            'error on crm update candidate helper',
            e,
          );
        }
      }
      return exits.success('ok');
    } catch (e) {
      console.log('error on crm update user helper', e);
      await sails.helpers.slack.errorLoggerHelper(
        'error on crm update user helper',
        e,
      );
      return exits.success('not ok');
    }
  },
};
