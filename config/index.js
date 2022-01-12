'use strict';

const _ = require('lodash');
const constant = require('../helper/constant');
const productionConfig = require('./production');
const developmentConfig = require('./development');
const sandboxConfig = require('./sandbox');
const qaConfig = require('./qa');
const localConfig = require('./local');

/**
 * Configures the application based on the NODE_ENV eg: "production, qa and develop"
 * return application configurations
 */

const loadConfig = () => {
  let config = {};
  switch (process.env.NODE_ENV) {
    case 'production':
      config = productionConfig;
      break;
    case 'development':
      config = developmentConfig;
      break;
    case 'qa':
      config = qaConfig;
      break;
    case 'sandbox':
      config = sandboxConfig;
      break;
    case 'local':
      config = localConfig;
      break;
    default:
      config = developmentConfig;
  };
  config = _.merge(config, constant);
  return config;
};

module.exports = loadConfig;
