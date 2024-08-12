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
    regenerate: {
      type: 'boolean',
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
      const {
        aiContent,
        key,
        campaignId,
        inputValues,
        oldVersion,
        regenerate,
      } = inputs;
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

      console.log('existingVersions', existingVersions);

      let versions = {};
      if (existingVersions) {
        versions = existingVersions?.data;
      }

      let foundKey = false;
      if (!versions[key]) {
        versions[key] = [];
      } else {
        foundKey = true;
      }

      // determine if we should update the current version or add a new one.
      // if regenerate is true, we should always add a new version.
      // if regenerate is false and its been less than 5 minutes since the last generation
      // we should update the existing version.

      let updateExistingVersion = false;
      if (
        regenerate === false &&
        foundKey === true &&
        versions[key].length > 0
      ) {
        const lastVersion = versions[key][0];
        const lastVersionDate = new Date(lastVersion?.date || 0);
        const now = new Date();
        const diff = now - lastVersionDate;
        if (diff < 300000) {
          updateExistingVersion = true;
        }
      }

      if (updateExistingVersion === true) {
        for (let i = 0; i < versions[key].length; i++) {
          let version = versions[key][i];
          if (
            JSON.stringify(version.inputValues) === JSON.stringify(inputValues)
          ) {
            // this version already exists. lets update it.
            versions[key][i].text = newVersion.text;
            versions[key][i].date = new Date().toString();
            break;
          }
        }
      }

      if (!foundKey && oldVersion) {
        console.log(`no key found for ${key} yet we have oldVersion`);
        // here, we determine if we need to save an older version of the content.
        // because in the past we didn't create a Content version for every new generation.
        // otherwise if they translate they won't have the old version to go back to.
        versions[key].push(oldVersion);
      }

      if (updateExistingVersion === false) {
        console.log('adding new version');
        // add new version to the top of the list.
        const length = versions[key].unshift(newVersion);
        if (length > 10) {
          versions[key].length = 10;
        }
      }

      // console.log('versions (final)', versions);

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
