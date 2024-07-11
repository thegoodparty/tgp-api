const appBase = sails.config.custom.appBase || sails.config.appBase;
const LOCAL_ENV = 'local';
const DEVELOPMENT_ENV = 'development';
const QA_ENV = 'qa';
const PRODUCTION_ENV = 'production';

const ENVIRONMENTS_MAP = {
  'http://localhost:4000': LOCAL_ENV,
  'https://dev.goodparty.org': DEVELOPMENT_ENV,
  'https://qa.goodparty.org': QA_ENV,
  'https://goodparty.org': PRODUCTION_ENV,
};

module.exports = {
  appEnvironment: ENVIRONMENTS_MAP[appBase],
  LOCAL_ENV,
  DEVELOPMENT_ENV,
  QA_ENV,
  PRODUCTION_ENV,
  ENVIRONMENTS_MAP,
};
