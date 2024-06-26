module.exports = {
  inputs: {
    aiContent: {
      type: 'json',
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
    oldVersion: {
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
      const { aiContent, key, campaignId, inputValues, oldVersion } = inputs;
      let newVersion;

      // we determine language by examining inputValues and tag it on the version.
      let language = 'English';
      if (inputValues && inputValues.length > 0) {
        inputValues.forEach((inputValue) => {
          if (inputValue?.language) {
            language = inputValue.language;
          }
        });
      }

      newVersion = {
        date: new Date().toString(),
        text: aiContent[key].content,
        // if new inputValues are specified we use those
        // otherwise we use the inputValues from the prior generation.
        inputValues:
          inputValues && inputValues.length > 0
            ? inputValues
            : aiContent[key]?.inputValues,
        language: language,
      };

      const existingVersions = await CampaignPlanVersion.findOne({
        campaign: campaignId,
      });
      let versions = {};
      if (existingVersions) {
        versions = existingVersions?.data;
      }

      let foundKey = false;
      // for aiContent we must have inputValues to do versioning.
      // if (subSectionKey === 'aiContent') {
      //   if (!inputValues || !Object.keys(inputValues).length > 0) {
      //     // however we only require it for successive versions.
      //     if (versions && versions[key]) {
      //       console.log('no input values specified. exiting...');
      //       return exits.success('ok');
      //     }
      //   }
      // }

      if (!versions[key]) {
        versions[key] = [];
      } else {
        foundKey = true;
      }

      let foundVersion = false;
      for (let i = 0; i < versions[key].length; i++) {
        let version = versions[key][i];
        if (
          JSON.stringify(version.inputValues) === JSON.stringify(inputValues)
        ) {
          // this version already exists. lets update it.
          versions[key][i].text = newVersion.text;
          versions[key][i].date = new Date().toString();
          foundVersion = true;
          break;
        }
      }

      if (!foundKey && oldVersion) {
        // here, we determine if we need to save an older version of the content.
        // because in the past we didn't create a Content version for every new generation.
        // otherwise if they translate they won't have the old version to go back to.
        versions[key].push(oldVersion);
      }

      if (foundVersion === false) {
        // add new version to the top of the list.
        const length = versions[key].unshift(newVersion);
        if (length > 10) {
          versions[key].length = 10;
        }
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
      console.log('error!', e);
      return exits.success('not ok');
    }
  },
};
