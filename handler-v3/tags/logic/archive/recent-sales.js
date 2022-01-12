'use strict';

const _ = require('lodash');

/**
 * Recent Sales controller
 * @param {object} df webhook fulfillment object
 * @param {object} sessionInfo df parameters
 */

const applyRecentSalesLayer = async (df, sessionInfo, filter) => {
  const capturedParameters = _.cloneDeep(filter);
  const userCurrentState = sessionInfo.userCurrentState || {};
  let recentSales = userCurrentState.recent_sales;
  const result = {
    isValid: true
  };
  if (userCurrentState && recentSales === undefined && capturedParameters.remove) {
    result.isValid = false;
    result.response = 'invalidRemoveAction';
    result.responseParams = { name: sessionInfo['given-name'] };
    return result;
  }
  if (!capturedParameters.remove) {
    if (!recentSales) recentSales = true;
    else {
      result.isValid = false;
      result.response = 'layerAlreadyApplied';
      result.responseParams = { name: sessionInfo['given-name'] };
      return result;
    }
  } else {
    if (recentSales === true) {
      recentSales = false;
      result.isValid = true;
      result.response = 'recentSalesRemoved';
    } else {
      result.isValid = false;
      result.response = 'layerNotActive';
      result.responseParams = { name: sessionInfo['given-name'] };
      return result;
    }
  }
  userCurrentState.recent_sales = recentSales;
  result.userCurrentState = userCurrentState;
  return result;
};

module.exports = { applyRecentSalesLayer };
