module.exports = {
  attributes: {
    id: {
      type: 'string',
      unique: true,
      required: true,
      autoIncrement: false,
    },
    userId: {
      model: 'user',
      required: true,
    },
    data: {
      type: 'json',
      required: true,
    },
  },
  // Disable the default `id` column
  autoMigrations: {
    safe: true,
  },
  tableName: 'checkout_session',
};
