module.exports = {
  friendlyName: 'All Candidates',

  description: 'admin call for getting all candidates',

  inputs: {
    id: {
      type: 'number',
    },
    updatedFields: {
      type: 'json',
    },
    updates: {
      type: 'json',
    },
    chamber: {
      type: 'string',
    },
    isIncumbent: {
      type: 'boolean',
    },
  },

  exits: {
    success: {
      description: 'AllCandidates',
    },

    badRequest: {
      description: 'Error getting candidates',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const { id, updatedFields, updates, chamber, isIncumbent } = inputs;

      let candidate;
      if (chamber === 'presidential') {
        candidate = await PresidentialCandidate.updateOne({
          id,
        }).set(updatedFields);
      } else if (isIncumbent) {
        candidate = await Incumbent.updateOne({
          id,
        }).set(updatedFields);
        candidate.isIncumbent = true;
      } else {
        candidate = await RaceCandidate.updateOne({
          id,
        }).set(updatedFields);
      }
      let isCampaignUpdates = false;
      // updates
      if (updates) {
        if (updates.existing) {
          const existingUpdates = updates.existing;
          if (existingUpdates.length > 0) {
            for (let i = 0; i < existingUpdates.length; i++) {
              if (existingUpdates[i] && existingUpdates[i].id) {
                const { id, text } = existingUpdates[i];
                if (text && text !== '') {
                  await CampaignUpdate.updateOne({ id }).set({
                    text,
                  });
                  isCampaignUpdates = true;
                }
              }
            }
          }
        }
        if (updates.newUpdates) {
          const newUpdates = updates.newUpdates;
          if (newUpdates.length > 0) {
            for (let i = 0; i < newUpdates.length; i++) {
              if (newUpdates[i] && newUpdates[i] !== '') {
                const update = await CampaignUpdate.create({
                  text: newUpdates[i],
                }).fetch();
                isCampaignUpdates = true;
                if (chamber === 'presidential') {
                  await PresidentialCandidate.addToCollection(
                    id,
                    'presCandUpdates',
                    update.id,
                  );
                } else if (isIncumbent) {
                  await Incumbent.addToCollection(
                    id,
                    'incumbentUpdates',
                    update.id,
                  );
                } else {
                  await RaceCandidate.addToCollection(
                    id,
                    'raceCandUpdates',
                    update.id,
                  );
                }
              }
            }
          }
        }
      }
      if (isCampaignUpdates) {
        const candidateSupports = await Support.find({
          candidate: id,
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
                    href="${appBase}/candidates/${firstName}-${lastName}/${id}"
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
      }
      const { state, district } = candidate || {};
      const incumbent = await sails.helpers.incumbentByDistrictHelper(
        state,
        district ? parseInt(district, 10) : district,
      );
      let incumbentRaised = 50000000;
      if (chamber !== 'presidential') {
        if (candidate.isIncumbent) {
          incumbentRaised = candidate.raised;
        } else {
          incumbentRaised = incumbent
            ? incumbent.raised || incumbent.combinedRaised
            : false;
          incumbentRaised = incumbentRaised ? incumbentRaised / 2 : false;
        }
      }

      const {
        isGood,
        isBigMoney,
        isMajor,
      } = await sails.helpers.goodnessHelper(
        candidate,
        chamber,
        incumbentRaised,
      );
      candidate.isGood = isGood;
      candidate.isBigMoney = isBigMoney;
      candidate.isMajor = isMajor;

      // getting campaign updates
      let candidateUpdates;

      if (chamber === 'presidential') {
        candidateUpdates = await PresidentialCandidate.findOne({
          id,
          isActive: true,
          isHidden: false,
        }).populate('presCandUpdates');
        candidate.campaignUpdates = candidateUpdates.presCandUpdates;
      } else {
        const upperChamber = chamber.charAt(0).toUpperCase() + chamber.slice(1);
        if (isIncumbent) {
          candidateUpdates = await Incumbent.findOne({
            id,
            chamber: upperChamber,
          }).populate('incumbentUpdates');
          candidate.campaignUpdates = candidateUpdates.incumbentUpdates;
        } else {
          candidateUpdates = await RaceCandidate.findOne({
            id,
            chamber: upperChamber,
            isActive: true,
            isHidden: false,
          }).populate('raceCandUpdates');
          candidate.campaignUpdates = candidateUpdates.raceCandUpdates;
        }
      }

      await sails.helpers.cacheHelper(
        'delete',
        `cand-${id}-${chamber}-${!!isIncumbent}`,
      );
      await sails.helpers.cacheHelper('delete', 'goodChallengers');
      await sails.helpers.cacheHelper('delete', 'presidential');
      await sails.helpers.triggerCandidateUpdate(candidate.id);
      return exits.success({
        candidate,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper(
        'Error at admin/update-candidate',
        e,
      );
      return exits.badRequest({
        message: 'Error updating candidates',
      });
    }
  },
};
