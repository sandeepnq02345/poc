'use strict';

const { postProcessGeography } = require('../../../../helper/processing/pre-post-process-geo');
const { setResponse } = require('../../../../helper/setResponse');
const { populateState } = require('../../../../helper/geography/populate-state');

/**
 * change Geography Confirmation controller
 * @param {object} df webhook fulfillment object
 * @param {object} sessionInfo df parameters
 */
const confirmGeoChange = async (df, sessionInfo) => {
  if (!Array.isArray(sessionInfo.geography.location)) {
    return;
  }
  sessionInfo.currentZipAndRegions = sessionInfo.geography.location.reduce((prev, cur) => {
    if (cur.zipcode || cur.region) {
      prev.push((cur.zipcode) || (cur.region));
    }
    return prev;
  }, []);
  sessionInfo = postProcessGeography(sessionInfo);
  sessionInfo.userCurrentState = await populateState(sessionInfo, true);
  df.setParameter('currentZipAndRegions', null);
  df.setParameter('userCurrentState', sessionInfo.userCurrentState);
  setResponse(df, 'recentSalesModified');
  df.setParameter('changeGeoConfirmation', null);
  df.setParameter('location', null);
  df.setParameter('geography', null);
};

module.exports = confirmGeoChange;
