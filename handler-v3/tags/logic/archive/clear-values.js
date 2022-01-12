'use strict';

const { operationsClearValues } = require('../../../../helper/archive/modify-operations');
const config = require('../../../../config')();
const { sliderMinMax } = config;

/**
 * Add Clear values controller
 * @param {object} df webhook fulfillment object
 * @param {object} sessionInfo df parameters
 */
const clearValues = async (df, sessionInfo, filter) => {
  let userCurrentState = sessionInfo.userCurrentState || {};
  const { min, max } = (userCurrentState && userCurrentState[filter]) || { min: null, max: null };
  const sliderMin = sliderMinMax && sliderMinMax[filter].min;
  const sliderMax = sliderMinMax && sliderMinMax[filter].max;
  const result = {
    isValid: true
  };
  if ((sessionInfo.operator === 'greater than' && (!min || min === sliderMin))) {
    result.isValid = false;
    result.response = 'noMinimum';
    return result;
  }
  if ((sessionInfo.operator === 'less than' && (!max || max === sliderMax))) {
    result.isValid = false;
    result.response = 'noMaximum';
    return result;
  }
  userCurrentState = await operationsClearValues[sessionInfo.operator](userCurrentState, filter);
  df.setParameter('operator', null);
  return result;
};

module.exports = clearValues;
