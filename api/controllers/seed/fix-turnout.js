module.exports = {
  friendlyName: 'Fix Turnout',

  description: 'Fix p2v turnout percentages.',

  inputs: {},

  exits: {
    success: {
      description: 'Ok',
      responseType: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    const p2vs = await sails.sendNativeQuery(`
        SELECT *
        FROM public.pathtovictory
        WHERE data->>'projectedTurnout' is not null and data->>'projectedTurnout' != ''
        AND data->>'averageTurnout' is not null and data->>'averageTurnout' != ''
        AND ((data->>'projectedTurnout')::numeric < 100 OR (data->>'averageTurnout')::numeric < 100)
        order by id desc limit 1;
    `);
    const rows = p2vs?.rows;
    console.log('rows', rows.length);
    for (const row of rows) {
      let id = row.id;
      try {
        console.log(`processing id ${id}`);
        await fixTurnout(id);
      } catch (error) {
        console.error('Error processing id', id, error);
      }
    }
    return exits.success({
      message: 'ok',
    });
  },
};

async function fixTurnout(id) {
  const pathToVictory = await PathToVictory.findOne({ id: id });
  const { data } = pathToVictory;

  const total = data.totalRegisteredVoters;
  const averageTurnout = data.averageTurnout;
  const projectedTurnout = data.projectedTurnout;
  console.log(
    `total: ${total} averageTurnout: ${averageTurnout} projectedTurnout: ${projectedTurnout}`,
  );

  let fixedAverageTurnout = averageTurnout;
  let fixedProjectedTurnout = projectedTurnout;

  if (averageTurnout < 100) {
    fixedAverageTurnout = ((averageTurnout / 100) * total).toFixed(0);
    console.log(
      `averageTurnout: ${averageTurnout} fixedAverageTurnout: ${fixedAverageTurnout}`,
    );
  }
  if (projectedTurnout < 100) {
    fixedProjectedTurnout = ((projectedTurnout / 100) * total).toFixed(0);
    console.log(
      `projectedTurnout: ${projectedTurnout} fixedProjectedTurnout: ${fixedProjectedTurnout}`,
    );
  }

  await PathToVictory.updateOne({ id: id }).set({
    data: {
      ...data,
      projectedTurnout: fixedProjectedTurnout,
      averageTurnout: fixedAverageTurnout,
    },
  });
}
