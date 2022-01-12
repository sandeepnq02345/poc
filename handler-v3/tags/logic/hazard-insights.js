'use strict';
const _ = require('lodash');
const { setResponse } = require('../../../helper/setResponse');
/**
 * Hazard Insights controller
 * @param {object} df webhook fulfillment object
 * @param {object} sessionInfo df parameters
 */
const provideHazardInsights = async (df, sessionInfo) => {
  const hasRecentRisk = _.sample([true, false]);

  if (hasRecentRisk) {
    setResponse(df, 'recentHazardsExist');
  } else {
    df.setParameter('hasNoRecentRiskFlag', true);
    setResponse(df, 'noRecentHazards');
    df.setResponseText('But before we start celebrating...');
  }
};

module.exports = provideHazardInsights;
