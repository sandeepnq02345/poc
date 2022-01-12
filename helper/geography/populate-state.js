'use strict';
const _ = require('lodash');
const { getStateCode } = require('./get-state-code');

/**
* It populates the sessionInfo.
* @param {Object} sessionInfo - session information.
* @param {String} replaceState - the state to be replaced.
* @return {Object} - sessionInfo.
*/
const populateState = async (sessionInfo, replaceState) => {
  let currentStates = [];
  if (sessionInfo && sessionInfo.geography && Array.isArray(sessionInfo.geography.location)) {
    currentStates = sessionInfo.geography.location.reduce((acc, cur) => {
      if (cur.state) {
        acc.push(cur.state);
      }
      return acc;
    }, []);
  }
  sessionInfo = _.cloneDeep(sessionInfo);
  const zipAndRegions = sessionInfo.currentZipAndRegions;
  if (!zipAndRegions) {
    return sessionInfo.userCurrentState;
  }
  const addedStates = [];
  for (const item of zipAndRegions) {
    const stateCode = await getStateCode(item);
    if (stateCode) {
      addedStates.push(stateCode);
    }
  }
  if (replaceState && addedStates.length > 0) {
    sessionInfo.userCurrentState.geography.state = Array.from(new Set([...currentStates, ...addedStates]));
  } else {
    sessionInfo.userCurrentState.geography.state = Array.from(new Set([...(sessionInfo.userCurrentState.geography.state || []), ...addedStates]));
  }
  delete sessionInfo.currentZipAndRegions;
  return sessionInfo.userCurrentState;
};

module.exports = { populateState };
