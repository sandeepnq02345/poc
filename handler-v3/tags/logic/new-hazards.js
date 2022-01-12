'use strict';
const { setResponse } = require('../../../helper/setResponse');
/**
 * Hazard Insights controller
 * @param {object} df webhook fulfillment object
 * @param {object} sessionInfo df parameters
 */
const checkForNewHazards = async (df, sessionInfo) => {
  const newHazardRiskCount = Math.floor(Math.random() * 100);

  if (newHazardRiskCount === 0) {
    df.setParameter('hasNoHazardRiskFlag', true);
    setResponse(df, 'noNewHazards');
    return;
  }

  setResponse(df, 'newHazardsExists', { hazardCount: newHazardRiskCount });
};

module.exports = checkForNewHazards;
