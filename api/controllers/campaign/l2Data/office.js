const axios = require('axios');
const path = require('path');
const fs = require('fs');

module.exports = {
  friendlyName: 'L2 Office',

  description: 'Get L2 Office',

  inputs: {},

  exits: {
    success: {
      description: 'Ok',
    },

    badRequest: {
      description: 'Error getting l2 office',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      // this view is just for testing the enqueuePathToVictory function
      // and the ballotReadyTest function

      // await ballotReadyTest();
      let campaign = await Campaign.findOne({
        id: 1,
      });
      // console.log('campaign', campaign);

      // let user = await User.findOne({
      //   id: campaign.user,
      // });

      await enqueuePathToVictory(campaign);
      await sails.helpers.queue.consumer();

      return exits.success({
        success: true,
        // office,
      });
    } catch (e) {
      console.log('error at l2Data/office', e);
      return exits.success({
        error: true,
        e,
      });
    }
  },
};

// this function is duplicated from api/helpers/campaign/onboarding/ai/create.js
// it is duplicated here only for testing. this file will be removed before going to production.

async function enqueuePathToVictory(campaign) {
  // TODO: add this back when we go to production.
  // if (appBase !== 'https://goodparty.org') {
  //   return;
  // }
  const { data } = campaign;
  const { details, goals } = data;
  const { office, state, city, district, officeTermLength } = details;
  const { electionDate } = goals;

  const currentYear = new Date().getFullYear();
  let electionYear = currentYear;
  if (electionDate) {
    electionYear = electionDate.split('-')[0];
  }

  // TODO: we don't currently store the election level in the campaign details
  // we need to add it to the campaign details
  // we currently guess by seeing if city is filled out.
  // we also need to add electionCounty to the campaign details

  let termLength = 0;
  // extract the number from the officeTermLength string
  if (officeTermLength) {
    termLength = officeTermLength.match(/\d+/)[0];
  }

  const queueMessage = {
    type: 'pathToVictory',
    data: {
      officeName: office,
      electionYear: electionYear,
      electionTerm: termLength,
      electionLevel: city ? 'city' : 'state',
      electionState: state,
      electionCounty: '',
      electionMunicipality: city,
      subAreaName: district ? 'district' : undefined,
      subAreaValue: district,
    },
  };
  await sails.helpers.queue.enqueue(queueMessage);
}

async function ballotReadyTest() {
  const races = await BallotRace.find({
    level: 'federal',
    // state: 'TN',
    isJudicial: false,
  })
    .populate('municipality')
    .populate('county');

  console.log('# races', races.length);

  // for each line, call the officeHelper function
  for (const race of races) {
    console.log('race', race);
    console.log(`processing ${race.data.position_name}`);

    const officeResponse = await sails.helpers.campaign.officeHelper(
      race.data.position_name,
      race.level,
      race.state,
      race.county ? race.county.name : undefined,
      race.municipality ? race.municipality.name : undefined,
      race.subAreaName ? race.subAreaName : undefined,
      race.subAreaValue ? race.subAreaValue : undefined,
    );

    console.log('officeResponse', officeResponse);

    // sleep for 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
