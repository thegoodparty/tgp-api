module.exports = {
  friendlyName: 'Update User Ranking',

  description: 'update chamber ranking for a logged in user.',

  inputs: {
    rank: {
      description: 'rank position for the candidate',
      example: 1,
      required: true,
      type: 'number',
    },

    candidateId: {
      description: 'candidate id to be ranked',
      example: 1,
      required: true,
      type: 'number',
    },

    chamber: {
      description: 'Candidate chamber',
      example: 'presidential',
      required: true,
      type: 'string',
    },

    state: {
      description: 'State for ranking',
      example: 'ca',
      required: false,
      type: 'string',
    },

    isIncumbent: {
      description: 'is the candidate an incumbent',
      example: false,
      required: false,
      type: 'boolean',
    },
  },

  exits: {
    success: {
      description: 'Ranking created',
    },

    badRequest: {
      description: 'Error creating ranking',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      let reqUser = this.req.user;
      const { rank, candidateId, chamber, state, isIncumbent } = inputs;
      // first make sure the user doesn't have that ranking already.
      const existingRanking = await Ranking.find({
        user: reqUser.id,
        chamber,
        candidate: candidateId,
        isIncumbent,
      });
      if (existingRanking.length > 0) {
        return exits.badRequest({
          message: 'User already ranked this candidate',
        });
      }
      if (!reqUser.shortState || reqUser.shortState === '') {
        if (state) {
          reqUser = await User.updateOne({
            id: reqUser.id,
          }).set({
            shortState: state,
          });
        }
        // else {
        //   return exits.badRequest({
        //     message: 'User is missing a state',
        //     missingState: true,
        //   });
        // }
      }
      await Ranking.create({
        user: reqUser.id,
        chamber,
        candidate: candidateId,
        rank,
        userState: reqUser.shortState || 'NA',
        isIncumbent,
      });
      let { candidate } = await sails.helpers.candidateFinder(
        candidateId,
        chamber,
        isIncumbent,
      );
      if (!candidate && candidateId < 0) {
        candidate = {
          name: 'A Good Candidate',
          chamber,
          blocName: `GoodBloc-${state.toUpperCase()}${
            chamber === 'house' ? candidateId * -1 : ''
          }`,
          district: candidateId * -1,
          state,
          isGoodBloc: true,
        };
      }
      if (candidate) {
        await sendRankingEmail(candidate, reqUser, candidateId, state);
      }

      const ranking = await Ranking.find({ user: reqUser.id });
      return exits.success({
        ranking,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper(
        'Error at user/ranking/rank-candidate',
        e,
      );
      return exits.badRequest({
        message: 'Error ranking candidate',
      });
    }
  },
};

const sendRankingEmail = async (candidate, user) => {
  const appBase = sails.config.custom.appBase || sails.config.appBase;
  const blocName = await sails.helpers.candidateBlocName(candidate);

  const subject = `Congrats! You’ve joined the ${candidate.name} crowd-voting campaign on The Good Party`;
  const firstName = user.name.split(' ')[0];

  let shareBloc = blocName;
  let asChamber;
  if (!candidate.chamber) {
    asChamber = 'U.S. President';
  } else if (candidate.chamber === 'Senate') {
    asChamber = `${candidate.state.toUpperCase()} Senator`;
    if (!candidate.isGoodBloc) {
      shareBloc += `-${candidate.state.toUpperCase()}`;
    }
  } else {
    asChamber = `${candidate.state.toUpperCase()}-${
      candidate.district
    } Representative`;
    if (!candidate.isGoodBloc) {
      shareBloc += `-${candidate.state.toUpperCase()}${candidate.district}`;
    }
  }
  const shareLink = `${appBase}?u=${user.uuid}&b=${shareBloc}`;
  const twitterHandler = blocName.replace('@', '');
  const twitterFollowLink = `http://twitter.com/intent/user?screen_name=${twitterHandler}`;
  const message = `<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
                     <tr>
                        <td><h2 style="color: #484848; text-align: left; font-size: 33px;  margin-top: 24px; margin-bottom: 24px;">
                            You’ve joined the ${candidate.name} crowd-voting campaign on The Good Party
                          </h2>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p style="font-family: Arial, sans-serif; font-size:18px; line-height:26px; color:#484848; margin:0; text-align: left">
                            Hi ${firstName},<br/> <br>
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td>
                            <p style="font-family: Arial, sans-serif; font-size:18px; line-height:26px; color:#484848; margin:0; text-align: left">
                              Thank you for joining <strong>${candidate.name}</strong> to see if we can get <strong>${
    candidate.name
  }</strong>  elected as <strong>${asChamber}</strong>.
                              <br/>
                              <br/>
                              We will let you know how this race progresses.
                              In the meanwhile please help spread the word and grow support for this campaign.
                              <br/><br/>
                              Share this link with friends to grow support:<br/>
                              <a href="${shareLink}">${shareLink}</a>
                            </p>
                         </td>
                      </tr>
                      ${
                        candidate.twitter
                          ? `<tr>
                        <td>
                          <br/><br/><br/>
                          <a href="${twitterFollowLink}" style="padding: 16px 32px; background-color: #117CB6; color: #FFF; border-radius: 40px; text-decoration: none;">
                            Follow ${blocName} on Twitter
                          </a>
                        </td>
                      </tr>`
                          : ''
                      }

                      ${
                        candidate.website
                          ? `<tr>
                        <td>
                          <br/><br/><br/>
                          <a href="${candidate.website}">
                            Visit ${candidate.name} Campaign Website
                          </a>
                        </td>
                      </tr>`
                          : ''
                      }



                    </table>`;
  const messageHeader = '';
  await sails.helpers.mailgunSender(
    user.email,
    user.name,
    subject,
    messageHeader,
    message,
  );
};
