'use strict';
const _ = require('lodash');
const config = require('../../config')();
const { preventPropertyRemovalTags } = config;

const processStateParams = (df, userCurrentState) => {
  const requestTag = df.getRequestTag();
  let processedStateParams = {};
  if (!preventPropertyRemovalTags.includes(requestTag)) {
    processedStateParams = clearPropertyData(userCurrentState);
  };

  processedStateParams = cleanStateParameters(userCurrentState);
  return processedStateParams;
};

/**
* It gives the finishing touches to the object.
* @param {Object} userCurrentState - current state of the user.
* @return {Object} - processedParameters.
*/
const cleanStateParameters = (userCurrentState) => {
  const processedParameters = _.cloneDeep(userCurrentState);
  if (!processedParameters || typeof processedParameters !== 'object') {
    return processedParameters;
  }
  for (const key in processedParameters) {
    if (['startDate', 'endDate'].includes(key)) {
      processedParameters[key] = JSON.stringify(processedParameters[key]);
      processedParameters[key] = (processedParameters[key].slice(-1) === 'Z')
        ? processedParameters[key].slice(0, -1) : processedParameters[key];
      processedParameters[key] = JSON.parse(processedParameters[key]);
    }

    if (typeof processedParameters[key] !== 'boolean' && typeof processedParameters[key] !== 'number' &&
      (!processedParameters[key] || (_.isArray(processedParameters[key]) && _.isEmpty(processedParameters[key])))) {
      delete processedParameters[key];
    }
    if (typeof processedParameters[key] === 'object') {
      processedParameters[key] = cleanStateParameters(processedParameters[key]);
    }
  }
  return processedParameters;
};

/**
 * Clear specific property information from previous query if previous query was specific property
 * @param {object} userCurrentState
 * @returns
 */
const clearPropertyData = (userCurrentState) => {
  if (!userCurrentState) return;

  const processedParameters = _.cloneDeep(userCurrentState);
  delete processedParameters.property_name;
  delete processedParameters.property_city;
  delete processedParameters.property_zipcode;
  return processedParameters;
};

module.exports = { processStateParams };
