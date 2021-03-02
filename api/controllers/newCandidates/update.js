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
  fn: async function (inputs, exits) {
    try {
      const { candidate } = inputs;
      const { imageBase64, id } = candidate;

      const name = `${candidate.firstName
        .toLowerCase()
        .replace(/ /g, '-')}-${candidate.lastName
        .toLowerCase()
        .replace(/ /g, '-')}`;
      // upload the image
      let { image } = candidate;
      const assetsBase =
        sails.config.custom.assetsBase || sails.config.assetsBase;
      const uuid = Math.random()
        .toString(36)
        .substring(2, 8);
      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:image\/.*;base64,/, '');

        const fileName = `${name}-${uuid}.${fileExt}`;

        const data = {
          Key: fileName,
          ContentEncoding: 'base64',
          ContentType: `image/${fileExt}`,
        };
        await sails.helpers.s3Uploader(
          data,
          `${assetsBase}/candidates`,
          cleanBase64,
        );
        image = `https://${assetsBase}/candidates/${fileName}`;
      }
      await uploadComparedImage(candidate);

      const cleanCandidate = {
        ...candidate,
        image,
      };

      delete cleanCandidate.imageBase64;
      const oldCandidate = await Candidate.findOne({ id });

      const updatedCandidate = await Candidate.updateOne({ id }).set({
        ...cleanCandidate,
      });
      // add the id to the JSON.stringified record
      await Candidate.updateOne({ id: updatedCandidate.id }).set({
        data: JSON.stringify({ ...cleanCandidate, id: updatedCandidate.id }),
      });
      if (
        oldCandidate.data &&
        updatedCandidate.data &&
        oldCandidate.data.candidateUpdates !=
          updatedCandidate.data.candidateUpdates
      ) {
        await notifySupporterForUpdates(updatedCandidate);
      }
      await sails.helpers.triggerCandidateUpdate(candidate.id);
      return exits.success({
        message: 'created',
      });
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
  const { race, firstName, lastName } = candidate || {};

  for (let i = 0; i < candidateSupports.length; i++) {
    const support = candidateSupports[i];
    // support.user.name, support.user.email
    const appBase = sails.config.custom.appBase || sails.config.appBase;
    const subject = `Campaign update from ${firstName} ${lastName} for ${race}`;
    const message = `<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
      <tbody>
        <tr>
          <td>
            <p
              style="
                font-family: Arial, sans-serif;
                font-size: 18px;
                line-height: 26px;
                color: ##555555;
                margin: 0;
                text-align: left;
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
                font-family: Arial, sans-serif;
                font-size: 18px;
                line-height: 26px;
                color: ##555555;
                margin: 0;
                text-align: left;
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
                font-family: Arial, sans-serif;
                font-size: 18px;
                line-height: 26px;
                color: ##555555;
                margin: 0;
                text-align: left;
              "
            >
            <br />
            Tap the link below to read the update.
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <br /><br /><br /><a
              href="${appBase}/candidates/${firstName}-${lastName}/${
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
const uploadComparedImage = async candidate => {
  const { comparedCandidates } = candidate;
  if (!comparedCandidates) {
    return;
  }
  const { uploadedImages, candidates } = comparedCandidates;
  if (!uploadedImages) {
    return;
  }
  const assetsBase = sails.config.custom.assetsBase || sails.config.assetsBase;

  for (let i = 0; i < candidates.length; i++) {
    if (uploadedImages[i]) {
      const { base64 } = uploadedImages[i];
      if (base64) {
        const uuid = Math.random()
          .toString(36)
          .substring(2, 8);
        const cleanBase64 = base64.replace(/^data:image\/.*;base64,/, '');

        const fileName = `${candidates[i].name}-${uuid}.${fileExt}`;
        const data = {
          Key: fileName,
          ContentEncoding: 'base64',
          ContentType: `image/${fileExt}`,
        };
        await sails.helpers.s3Uploader(
          data,
          `${assetsBase}/candidates`,
          cleanBase64,
        );
        candidates[i].image = `https://${assetsBase}/candidates/${fileName}`;
      }
    }
  }
  delete comparedCandidates.uploadedImages;
};
