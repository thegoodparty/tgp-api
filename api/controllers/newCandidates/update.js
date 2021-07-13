/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

const fileExt = 'jpeg';

module.exports = {
  friendlyName: 'Update Candidate',

  description: 'Admin endpoint to edit a candidate.',

  inputs: {
    candidate: {
      type: 'json',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Candidate Update',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Candidate update Failed',
      responseType: 'badRequest',
    },
  },
  fn: async function(inputs, exits) {
    try {
      const { candidate } = inputs;
      const { candidateUpdates } = candidate;
      delete candidate['updates'];
      delete candidate['updatesDates'];
      delete candidate['candidateUpdates'];
      const { id } = candidate;

      const cleanCandidate = {
        ...candidate,
        firstName: candidate.firstName.trim(),
        lastName: candidate.lastName.trim(),
        chamber: candidate.chamber.trim(),
        // image,
        isActive: !!candidate.isActive,
      };

      // delete cleanCandidate.imageBase64;
      const oldCandidate = await Candidate.findOne({ id }).populate(
        'candidateUpdates',
      );

      const updatedCandidate = await Candidate.updateOne({ id }).set({
        ...cleanCandidate,
      });
      // add the id to the JSON.stringified record
      await Candidate.updateOne({ id: updatedCandidate.id }).set({
        data: JSON.stringify({ ...cleanCandidate, id: updatedCandidate.id }),
      });
      try {
        let oldCandidateUpdates = oldCandidate.candidateUpdates;
        let isUpdated = false;
        for (let i = 0; i < oldCandidateUpdates.length; i++) {
          const updatedItem = candidateUpdates.find(
            item => item.id === oldCandidateUpdates[i].id,
          );
          if (oldCandidateUpdates[i].id && !updatedItem) {
            await CampaignUpdate.destroyOne({ id: oldCandidateUpdates[i].id });
          }
          if (updatedItem) {
            if (
              updatedItem.date !== oldCandidateUpdates[i].date ||
              updatedItem.text !== oldCandidateUpdates[i].text
            ) {
              await CampaignUpdate.updateOne({ id: updatedItem.id }).set({
                ...oldCandidateUpdates[i],
                ...updatedItem,
              });
            }
          }
        }
        const newItems = candidateUpdates.filter(item => !item.id);
        for (let i = 0; i < newItems.length; i++) {
          await CampaignUpdate.create({
            ...newItems[i],
            candidate: oldCandidate.id,
          }).fetch();
          isUpdated = true;
        }
        const oldData = JSON.parse(oldCandidate.data);
        if (isUpdated) {
          await notifySupporterForUpdates(updatedCandidate);
        }
        await sails.helpers.triggerCandidateUpdate(candidate.id);
        return exits.success({
          message: 'created',
        });
      } catch (e) {
        console.log('error sending notifications', e);
      }
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error registering candidate.' });
    }
  },
};
const notifySupporterForUpdates = async candidate => {
  const candidateSupports = await Support.find({
    candidate: candidate.id,
  }).populate('user');
  const { data, firstName, lastName } = candidate || {};
  const { race } = JSON.parse(data);
  for (let i = 0; i < candidateSupports.length; i++) {
    const support = candidateSupports[i];
    if (!support.user) {
      continue;
    }
    // support.user.name, support.user.email
    const appBase = sails.config.custom.appBase || sails.config.appBase;
    const subject = `Campaign update from ${firstName} ${lastName} for ${race}`;
    const message = `<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
      <tbody>
        <tr>
          <td>
            <p
              style="
                font-size: 16px;
                font-family: Arial, sans-serif;
                margin-top: 0;
                margin-bottom: 5px;
              "
            >
              Hi ${support.user.firstName || support.user.name}!<br /><br />
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <p
              style="
                font-size: 16px;
                font-family: Arial, sans-serif;
                margin-top: 0;
                margin-bottom: 5px;
              "
            >
            ${firstName} ${lastName}, who you endorsed for ${race}, has posted an update about their campaign.
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <p
              style="
                font-size: 16px;
                font-family: Arial, sans-serif;
                margin-top: 0;
                margin-bottom: 5px;
              "
            >
            <br />
            Tap the link below to read the update.
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <br /><br /><a
              href="${appBase}/candidate/${firstName}-${lastName}/${
      candidate.id
    }"
              style="
                padding: 16px 32px;
                background: linear-gradient(
                    103.63deg,
                    rgba(255, 15, 19, 0.15) -3.51%,
                    rgba(191, 0, 32, 0) 94.72%
                  ),
                  linear-gradient(
                    257.82deg,
                    rgba(67, 0, 211, 0.25) -11.17%,
                    rgba(67, 0, 211, 0) 96.34%
                  ),
                  #5c00c7;
                color: #fff;
                font-size: 16px;
                border-radius: 8px;
                text-decoration: none;
              "
            >
              READ UPDATE
            </a>
          </td>
        </tr>
      </tbody>
    </table>
      `;

    const messageHeader = '';
    await sails.helpers.mailgunSender(
      support.user.email,
      support.user.name,
      subject,
      messageHeader,
      message,
    );
  }
};
