module.exports = {
  friendlyName: 'Update User Ranking',

  description: 'update chamber ranking for a logged in user.',

  inputs: {
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
      const { candidateId, chamber, state, isIncumbent } = inputs;
      const rank = (await Ranking.count({ user: reqUser.id })) + 1;
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
      await sails.helpers.updateTag(
        reqUser.email,
        'The Good Party',
        chamber,
        candidateId,
        isIncumbent,
        'active',
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
      const candidateWithFields = await sails.helpers.findCandidateWithFields(
        candidateId,
        chamber,
        !!isIncumbent,
      );
      return exits.success({
        ranking,
        candidateWithFields,
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

  const route = candidateRoute(candidate);
  const shareLink = `${appBase}${route}?u=${user.uuid}&share=true`;
  // const twitterHandler = blocName.replace('@', '');
  const message = `
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
              Thank you for joining the
              <strong>${candidate.name}</strong> crowd-voting campaign for ${asChamber}. We will keep you updated on
              how this race progresses. In the meantime, please share this campaign with your friends to grow
              support and get the votes needed to win!
              <br />
              <br />
              <br />
              <div style="text-align: center">
                <a
                  href="${shareLink}"
                  style="padding: 16px 48px; background-color: #117CB6; color: #FFF; border-radius: 40px; text-decoration: none; font-size: 18px; font-weight: 700"
                >
                  &nbsp;&nbsp; SHARE &nbsp;&nbsp;
                </a>
              </div>
              <br />
              <br />
              <div style="text-align: center">
                <a
                  href="${appBase}/verify-vote"
                  style="padding: 16px 48px; background-color: #117CB6; color: #FFF; border-radius: 40px; text-decoration: none; font-size: 18px; font-weight: 700"
                >
                  &nbsp;&nbsp; Check you voter registration &nbsp;&nbsp;
                </a>
              </div>
            </p>
            <p style="font-family: Arial, sans-serif; font-size:18px; line-height:26px; color:#484848; margin:0; text-align: left">
              <br />
              <br />
              The Good Party is always free for both voters and candidates.
              </p>
          </td>
        </tr>
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

const candidateRoute = candidate => {
  if (!candidate) {
    return '/';
  }
  const { isIncumbent, chamber } = candidate;
  const chamberLower = chamber ? chamber.toLowerCase() : 'presidential';
  const name = slugify(candidate.name);
  return `/elections/candidate/${chamberLower}${
    isIncumbent ? '-i' : ''
  }/${name}/${candidate.id}`;
};

const slugify = text => {
  if (!text) {
    return '';
  }
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};
