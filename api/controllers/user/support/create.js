module.exports = {
  friendlyName: 'User supports a candidate',

  inputs: {
    candidateId: {
      description: 'candidate id to be supported',
      example: 1,
      required: true,
      type: 'number',
    },
    message: {
      description: 'personal note from the user',
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Support created',
    },

    badRequest: {
      description: 'Error creating support',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      let reqUser = this.req.user;
      const { candidateId, message } = inputs;
      const candidate = await Candidate.findOne({
        id: candidateId,
        isActive: true,
      });
      // first make sure the user doesn't have that ranking already.
      const existingSupport = await Support.find({
        user: reqUser.id,
        candidate: candidateId,
      });
      if (existingSupport.length > 0) {
        return exits.badRequest({
          message: 'User already supports this candidate',
        });
      }

      await Support.create({
        user: reqUser.id,
        candidate: candidateId,
        message,
      });

      const appBase = sails.config.custom.appBase || sails.config.appBase;
      const firstName = reqUser.name.split(' ')[0];
      const { race } = JSON.parse(candidate.data);
      try {
        // await sails.helpers.updateTag(reqUser.email, candidateId, 'active');
        await sails.helpers.crm.associateUserCandidate(reqUser, candidate);
      } catch (e) {
        console.log('error updating tag', e);
      }
      const subject = `Thank you for endorsing ${candidate.firstName} ${candidate.lastName} for ${race}!`;

      // const twitterHandler = blocName.replace('@', '');
      const messageContent = `
            <table
            border="0"
            cellPadding="0"
            cellSpacing="0"
            height="100%"
            width="100%"
          >
            <tr>
              <td>
                <p style="font-family: Arial, sans-serif; font-size:18px; line-height:26px; color:#484848; margin:0; text-align: left">
                  Hi ${firstName},<br /> <br />
                </p>
              </td>
            </tr>

            <tr>
              <td>
                <p style="font-family: Arial, sans-serif; font-size:18px; line-height:26px; color:#484848; margin:0; text-align: left">
                  Thank you for taking the first step toward making a difference by endorsing <strong>${candidate.firstName} ${candidate.lastName} </strong> for ${race}. We will keep you updated as this crowd-voting campaign progresses!
                  <br />
                  <br />
                  In the meantime, please invite some friends to help spread the word.
                  <br />
                  <br />
                  <br />
                  <a
                  href="${appBase}/candidate/${candidate.firstName}-${candidate.lastName}/${candidate.id}?preview=true&fromshare=true"
              style="
                padding: 16px 32px;
                background: linear-gradient(
                    103.63deg,
                    rgba(255, 15, 19, 0.15) -3.51%,
                    rgba(158, 128, 133, 0) 94.72%
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
                INVITE FRIENDS
              </a>
            </p>
          </td>
        </tr>
      </table>`;
      const messageHeader = '';
      try {
        await sails.helpers.mailgun.mailgunSender(
          reqUser.email,
          reqUser.name,
          subject,
          messageHeader,
          messageContent,
        );
      } catch (e) {
        console.log('error sending email');
      }
      try {
        await sails.helpers.triggerCandidateUpdate(candidateId);
      } catch (e) {
        console.log('error trigger candidate update');
      }
      try {
        // await sails.helpers.crm.tag(reqUser, candidate);
        console.log('success');
      } catch (e) {}

      return exits.success({
        message: 'support created',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error supporting candidate',
      });
    }
  },
};

