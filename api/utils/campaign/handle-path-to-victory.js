const handlePathToVictory = async ({
  campaignId,
  officeName,
  electionDate,
  electionTerm,
  electionLevel,
  electionState,
  electionCounty,
  electionMunicipality,
  subAreaName,
  subAreaValue,
  partisanType,
  priorElectionDates,
}) => {
  let slug = '';
  //create or update each election and position

  console.log('entered handlePathToVictory');
  console.log('campaignId', campaignId);

  let pathToVictoryResponse = {
    electionType: '',
    electionLocation: '',
    district: '',
    counts: {
      total: 0,
      democrat: 0,
      republican: 0,
      independent: 0,
    },
  };

  let campaign;
  try {
    campaign = await Campaign.findOne({ id: campaignId });
  } catch (e) {
    console.log('error getting campaign', e);
  }
  if (!campaign) {
    console.log('error: no campaign found');
    return;
  }
  slug = campaign.slug;
  // sails.helpers.log(slug, 'campaign', campaign);
  sails.helpers.log(slug, 'handling p2v for campaignId', campaignId);

  try {
    const officeResponse = await sails.helpers.campaign.officeHelper(
      officeName,
      electionLevel,
      electionState,
      electionCounty,
      electionMunicipality,
      subAreaName,
      subAreaValue,
    );
    sails.helpers.log(slug, 'officeResponse', officeResponse);

    let electionTypes;
    let electionDistricts;
    if (officeResponse && officeResponse?.electionTypes) {
      electionTypes = officeResponse.electionTypes;
    }
    if (officeResponse && officeResponse?.electionDistricts) {
      electionDistricts = officeResponse.electionDistricts;
    }

    sails.helpers.log(slug, 'electionTypes', electionTypes);
    sails.helpers.log(slug, 'electionDistricts', electionDistricts);

    let attempts = 0;
    if (electionTypes && electionTypes.length > 0) {
      for (let electionType of electionTypes) {
        // for now we only try the top district in the list.
        let district;
        sails.helpers.log(
          slug,
          `checking if electionDistricts has ${electionType}`,
        );
        let electionTypeName = electionType.column;
        if (
          electionDistricts &&
          electionDistricts.hasOwnProperty(electionTypeName) &&
          electionDistricts[electionTypeName].length > 0
        ) {
          district = electionDistricts[electionTypeName][0].value;
          electionType = electionDistricts[electionTypeName][0];
        }
        sails.helpers.log(slug, 'district', district);
        sails.helpers.log(slug, 'electionType', electionType);

        if (officeName === 'President of the United States') {
          // special case for President.
          electionState = 'US';
        }

        const counts = await sails.helpers.campaign.countHelper(
          electionTerm,
          electionDate ? electionDate : new Date().toISOString().slice(0, 10),
          electionState,
          electionType.column,
          electionType.value,
          district,
          partisanType,
          priorElectionDates,
        );
        sails.helpers.log(slug, 'counts', counts);

        if (counts && counts?.total && counts.total > 0) {
          pathToVictoryResponse.electionType = electionType.column;
          pathToVictoryResponse.electionLocation = electionType.value;
          pathToVictoryResponse.electionDistrict = district;
          pathToVictoryResponse.counts = counts;
          await saveL2Counts(counts, electionType, district);
          break;
        }
        attempts++;
        if (attempts > 10) {
          // we now limit electionTypes to 10.
          break;
        }
      }
    }

    return {
      campaign,
      pathToVictoryResponse,
      officeResponse,
      officeName,
      electionDate,
      electionTerm,
      electionLevel,
      electionState,
      electionCounty,
      electionMunicipality,
      subAreaName,
      subAreaValue,
      partisanType,
    };
  } catch (e) {
    sails.helpers.log(slug, 'error in handle-p2v', e);
    await sails.helpers.slack.errorLoggerHelper('error in handle-p2v', e);
    throw new Error('error in handle-p2v');
  }
};

async function saveL2Counts(counts, electionType, district) {
  if (electionType && electionType?.column && electionType.column !== '') {
    try {
      const existingObj = await l2Count.findOne({
        electionType: electionType.column,
        electionLocation: electionType.value,
        electionDistrict: district,
      });
      if (existingObj) {
        await l2Count
          .updateOne({
            electionType: electionType.column,
            electionLocation: electionType.value,
            electionDistrict: district,
          })
          .set({
            counts: counts,
          });
      } else {
        await l2Count.create({
          electionType: electionType.column,
          electionLocation: electionType.value,
          electionDistrict: district,
          counts: counts,
        });
      }
    } catch (e) {
      console.log('error saving l2Count', e);
    }
  }
}

module.exports = handlePathToVictory;
