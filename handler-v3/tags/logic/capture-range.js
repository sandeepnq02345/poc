'use strict';
const _ = require('lodash');
const { setResponse } = require('../../../helper/setResponse');
const { retryResponseHandler } = require('../../../helper/validation/invalid-input');
const modifyFilters = require('./modify-filters');

/**
 * Add Clear filters controller
 * @param {object} df webhook fulfillment object
 * @param {object} sessionInfo df parameters
 */
const captureRange = async (df, sessionInfo = {}) => {
  const intentParameters = df.getIntentParameters();
  const hasCapturedRange = !!(intentParameters.range);

  if (!hasCapturedRange) {
    df.setParameter('range', null);
    retryResponseHandler(df);
    return;
  }

  const capturedFilter = sessionInfo.captured_filters || [];

  capturedFilter[0].filters_combination.range = sessionInfo.range;
  df.setIntentParamters('captured_filters', capturedFilter);
  df.setIntentParamters('range', null);

  const capturedFilters = _.cloneDeep(sessionInfo.captured_filters);
  const filterType = capturedFilters && capturedFilters[0] && capturedFilters[0].filters_combination.filters;
  if (!filterType) {
    df.setParameter('range', null);
    return setResponse(df, 'noFilterCaptured');
  }
  await modifyFilters(df, sessionInfo);
  df.setParameter('range', null);
};

module.exports = captureRange;
