'use strict';

const config = require('../../../../config')();
const { retainSessionInfo } = config;
// const { setResponse } = require('../../../helper/setResponse');
/**
 * Start over controller
 * @param {object} df webhook fulfillment object
 * @param {object} sessionInfo df parameters
 */

const startOverOperation = async (df, sessionInfo) => {
  const sessionInfoKeys = Object.keys(sessionInfo);
  for (const key of sessionInfoKeys) {
    if (!retainSessionInfo.includes(key)) df.setParameter(key, null);
  }
};

module.exports = startOverOperation;
