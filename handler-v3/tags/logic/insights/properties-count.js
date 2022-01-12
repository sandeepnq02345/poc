'use strict';

const { setResponse } = require('../../../../helper/setResponse');

/**
 * Properties count controller
 * @param {object} df webhook fulfillment object
 * @param {object} sessionInfo df parameters
 */

const propertiesCount = async (df, sessionInfo) => {
  // all finalParameter should be used to query and fetch results
  setResponse(df, 'propertyInfo', { propertiesCount: Math.floor(Math.random() * 1000) + 1 });
};
module.exports = propertiesCount;
