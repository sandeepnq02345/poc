'use strict';
const { setResponse } = require('../../../../helper/setResponse');
const logger = require('../../../../lib/logger');
const _ = require('lodash');
const { preProcessParams } = require('../../../../models/preprocess-entities');
/**
 * Add Clear filters controller
 * @param {object} df webhook fulfillment object
 * @param {object} sessionInfo df parameters
 */
const clearFilters = async (df, sessionInfo = {}) => {
  const capturedFilters = sessionInfo['captured_filters'] || [];
  const preProcessedData = preProcessParams(capturedFilters);

  const filterToRemove = preProcessedData.filter((filterData) => (filterData.action === 'remove' && !filterData.range));
  const removeFilterSchema = filterToRemove && filterToRemove[0] && (filterToRemove[0].filterSchema);

  if (!removeFilterSchema) {
    logger.log('error', 'No filter captured');
    return;
  }

  _.unset(sessionInfo.userCurrentState, removeFilterSchema);
  setResponse(df, 'removeFiltersSuccess');
  df.setParameter('user_actions', null);
  df.setParameter('captured_filters', null);
};

module.exports = clearFilters;
