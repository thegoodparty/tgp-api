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
    inputValues: {
      type: 'json',
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
      const { data, subSectionKey, key, campaignId, inputValues } = inputs;
      let previousVersion;

      if (subSectionKey === 'aiContent') {
        previousVersion = {
          date: new Date().toString(),
          text: data[subSectionKey][key].content,
          inputValues: data[subSectionKey][key].inputValues,
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

      // for aiContent, the versions will only get updated
      // whenever a prompt value is changed / re-generated.
      if (subSectionKey === 'aiContent') {
        if (!inputValues || !Object.keys(inputValues).length) {
          return exits.success('ok');
        }
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
