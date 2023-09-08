module.exports = {
  attributes: {
    state: {
      type: 'string',
    },
    year: {
      type: 'string',
      required: true,
    },
    reportType: {
      type: 'string',
      required: true,
    },
    reportPeriod: {
      type: 'string',
      required: true,
    },
    relativeDueDate: {
      type: 'string',
    },
    dueDate: {
      type: 'string', // bigint does not support number in sails so it returns as string.
      columnType: 'bigint', // stores in the database as bigint.
      required: true,
    },
  },

  // NOTE: be sure to apply this index to the database manually:
  // CREATE INDEX IF NOT EXISTS index_state ON public.electiondeadlines (state);
  // CREATE INDEX IF NOT EXISTS index_duedate ON public.electiondeadlines (dueDate);

  // the query is valid but afterCreate does not appear to execute.
  //   afterCreate: async function () {
  //     await sails.sendNativeQuery(
  //       `CREATE INDEX IF NOT EXISTS index_state ON public.electiondeadlines (state);`,
  //     );
  //   },
};
