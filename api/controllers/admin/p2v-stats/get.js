module.exports = {
  friendlyName: 'Get Path To Victory Stats',

  inputs: {},

  exits: {
    success: {
      description: 'Campaign Found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Bad Request',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const auto = await getAutoP2V();
      const manual = await getManualP2V();
      const pending = await getPendingP2V();
      const total = auto + manual + pending;
      const p2vStats = {
        auto,
        manual,
        pending,
        total,
      };
      return exits.success({ p2vStats });
    } catch (e) {
      console.log('Error at p2v-stats', e);
      await sails.helpers.slack.errorLoggerHelper('Error at p2v-stats', e);
      return exits.badRequest();
    }
  },
};

async function getAutoP2V() {
  // get todays date in format yyyy-mm-dd
  const today = new Date();
  const date =
    today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

  //
  let count = 0;
  let query = `
  SELECT COUNT(*)
  FROM public.campaign AS c
  JOIN public.pathtovictory AS pathtovictory ON c.id = pathtovictory.campaign
  WHERE c.details->>'electionDate' > '${date}'
    AND c.details->>'raceId' IS NOT NULL
    AND (pathtovictory.data->>'p2vStatus'='Complete')
    AND pathtovictory.data->>'p2vNotNeeded' IS NULL
    AND pathToVictory.data->>'electionType' IS NOT NULL;
  `;
  console.log('running query', query);
  try {
    const sqlResponse = await sails.sendNativeQuery(query);
    count = sqlResponse?.rows[0]?.count;
    if (count) {
      count = parseInt(count);
    }
    console.log('count', count);
  } catch (e) {
    console.log('Error at p2v-stats', e);
    await sails.helpers.slack.errorLoggerHelper('Error at p2v-stats', e);
    return exits.badRequest();
  }
  return count;
}

async function getManualP2V() {
  // get todays date in format yyyy-mm-dd
  const today = new Date();
  const date =
    today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

  // TODO: switch to checking for data->>'completedBy' IS NULL
  let count = 0;
  let query = `
  SELECT COUNT(*)
  FROM public.campaign AS c
  JOIN public.pathtovictory AS pathtovictory ON c.id = pathtovictory.campaign
  WHERE c.details->>'electionDate' > '${date}'
    AND (pathtovictory.data->>'p2vStatus'='Complete')
    AND pathtovictory.data->>'p2vNotNeeded' IS NULL
    AND pathToVictory.data->>'electionType' IS NULL;
  `;
  console.log('running query', query);
  try {
    const sqlResponse = await sails.sendNativeQuery(query);
    count = sqlResponse?.rows[0]?.count;
    if (count) {
      count = parseInt(count);
    }
    console.log('count', count);
  } catch (e) {
    console.log('Error at p2v-stats', e);
    await sails.helpers.slack.errorLoggerHelper('Error at p2v-stats', e);
    return exits.badRequest();
  }
  return count;
}

async function getPendingP2V() {
  // get todays date in format yyyy-mm-dd
  const today = new Date();
  const date =
    today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

  let count = 0;
  let query = `
  SELECT COUNT(*)
  FROM public.campaign AS c
  JOIN public.pathtovictory AS pathtovictory ON c.id = pathtovictory.campaign
  WHERE c.details->>'electionDate' > '${date}'
  AND c.details->>'pledged'='true'
  AND (c.details->>'runForOffice'='yes' or c.details->>'knowRun'='true')
  AND c.details->>'electionDate' is not null
  AND (pathtovictory.data->>'p2vStatus'='Waiting' OR pathtovictory.data->>'p2vStatus' is null)
  AND pathtovictory.data->>'p2vNotNeeded' IS NULL
  `;
  console.log('running query', query);
  try {
    const sqlResponse = await sails.sendNativeQuery(query);
    count = sqlResponse?.rows[0]?.count;
    if (count) {
      count = parseInt(count);
    }
    console.log('count', count);
  } catch (e) {
    console.log('Error at p2v-stats', e);
    await sails.helpers.slack.errorLoggerHelper('Error at p2v-stats', e);
    return exits.badRequest();
  }
  return count;
}
