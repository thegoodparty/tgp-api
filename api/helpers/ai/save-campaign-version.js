module.exports = {
  inputs: {
    data: {
      type: 'json',
    },
    subSectionKey: {
      type: 'string',
    },
    key: {
      type: 'string',
    },
    campaignId: {
      type: 'number',
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
      const { data, subSectionKey, key, campaignId } = inputs;
      let previousVersion;

      if (subSectionKey === 'aiContent') {
        previousVersion = {
          date: new Date().toString(),
          text: data[subSectionKey][key].content,
        };
      } else {
        previousVersion = {
          date: new Date().toString(),
          text: data[subSectionKey][key],
        };
      }

      if (!previousVersion) {
        return;
      }
      const existingVersions = await CampaignPlanVersion.findOne({
        campaign: campaignId,
      });
      let versions = {};
      if (existingVersions) {
        versions = existingVersions.data;
      }

      if (!versions[key]) {
        versions[key] = [];
      }
      const length = versions[key].unshift(previousVersion);
      if (length > 10) {
        versions[key].length = 10;
      }

      if (existingVersions) {
        await CampaignPlanVersion.updateOne({
          campaign: campaignId,
        }).set({
          data: versions,
        });
      } else {
        await CampaignPlanVersion.create({
          campaign: campaignId,
          data: versions,
        });
      }
      return exits.success('ok');
    } catch (e) {
      return exits.success('not ok');
    }
  },
};
