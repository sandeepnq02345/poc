'use strict';

const { setResponse } = require('../../../../helper/setResponse');
const { retryResponseHandler, clearRetryHandlerCount } = require('../../../../helper/validation/invalid-input');
const _ = require('lodash');
const { populateState } = require('../../../../helper/geography/populate-state');
const { preprocessGeography, postProcessGeography } = require('../../../../helper/processing/pre-post-process-geo');
const constant = require('../../../../helper/constant');

const TYPE = {
  GEOGRAPHY: 'geography'
};

/**
 * Modify Geography controller
 * @param {object} df webhook fulfillment object
 * @param {object} sessionInfo df parameters
 */
const modifyGeography = async (df, sessionInfo) => {
  const capturedParameters = df.getIntentParameters();
  const hasCapturedParameters = !!(capturedParameters.location || capturedParameters.captured_lien_state);
  if (!hasCapturedParameters) {
    retryResponseHandler(df);
    df.setParameter('user_actions', null);
    return;
  }

  if (sessionInfo.captured_lien_state) {
    const geographyObject = { geography: {} };
    const hasRemove = !!(sessionInfo.captured_lien_state.filter((lienState) => lienState.remove).length);
    geographyObject.geography.state = (hasRemove && _.get(sessionInfo, 'userCurrentState.geography.state'))
      ? sessionInfo.userCurrentState.geography.state : [];
    sessionInfo.captured_lien_state = _.uniqBy(sessionInfo.captured_lien_state);
    if (sessionInfo.captured_lien_state.length <= 2) {
      sessionInfo.captured_lien_state.forEach(state => {
        if (state.remove) {
          geographyObject.geography.state = geographyObject.geography.state.filter(states => !constant[state.lien_state].includes(states));
        } else {
          geographyObject.geography.state = [...new Set([...geographyObject.geography.state, ...constant[state.lien_state]])];
        }
      });
    } else {
      df.setResponse(df, 'complexQuery');
      return;
    }
    sessionInfo.userCurrentState = { ...sessionInfo.userCurrentState, ...geographyObject };
    setResponse(df, 'modifyGeographySuccess');
    const processedFilters = sessionInfo.processedFilters || [];
    processedFilters.push('geography');
    df.setParameter('processedFilters', processedFilters);
    df.setParameter('captured_lien_state', null);
    if (!capturedParameters.location) return;
  }

  if (!sessionInfo.userCurrentState) {
    sessionInfo.userCurrentState = {};
  }
  if (!sessionInfo.userCurrentState.geography) {
    sessionInfo.userCurrentState.geography = {};
  }
  sessionInfo = await preprocessGeography(sessionInfo);

  let customerActions = preProcessCustomerActions(capturedParameters.user_actions);
  sessionInfo.confirmNewLocation = false;
  const stateCount = (sessionInfo.geography && sessionInfo.geography.location &&
    sessionInfo.geography.location.filter((geo) => geo.state).length) || 0;
  const otherGeoCount = (sessionInfo.geography && sessionInfo.geography.location &&
    sessionInfo.geography.location.filter((geo) => !geo.state).length) || 0;
  if ((stateCount + otherGeoCount === 1 || (stateCount === 1 && otherGeoCount === 1)) && customerActions && customerActions.length === 2) {
    customerActions = ['UPDATE'];
  }
  if (sessionInfo.geography && sessionInfo.geography.location &&
    customerActions && customerActions.length === 2 &&
    (sessionInfo.geography.location.length > 2)) {
    setResponse(df, 'confirmGeographyToAdd');
    delete sessionInfo.currentZipAndRegions;
    df.setParameter('addGeoConfirmation', true);
    return;
  }
  if (!customerActions || (customerActions &&
    (!_.isArray(customerActions) || customerActions.length === 0 || customerActions.length > 2))) {
    sessionInfo = postProcessGeography(sessionInfo);
    sessionInfo.userCurrentState = await populateState(sessionInfo, true);
  };
  if (customerActions && customerActions.length === 1) {
    sessionInfo = executeSingleAction(customerActions[0], TYPE.GEOGRAPHY, capturedParameters, sessionInfo);
  }
  if (customerActions && customerActions.length === 2) {
    sessionInfo = executeDualAction(df, customerActions, TYPE.GEOGRAPHY, capturedParameters, sessionInfo);
  }
  if (sessionInfo.populateState) {
    delete sessionInfo.populateState;
    sessionInfo.userCurrentState = await populateState(sessionInfo, sessionInfo.replaceState);
    delete sessionInfo.replaceState;
  }
  if (sessionInfo.confirmNewLocation) {
    setResponse(df, 'confirmNewLocation');
    df.setParameter('confirmNewLocation', true);
  } else {
    if (sessionInfo.geoInvalid) {
      setResponse(df, sessionInfo.geoInvalid, { name: sessionInfo['given-name'] });
    } else {
      setResponse(df, 'modifyGeographySuccess');
      const processedFilters = sessionInfo.processedFilters || [];
      processedFilters.push('geography');
      df.setParameter('processedFilters', processedFilters);
    }
    df.setParameter('confirmNewLocation', false);
  }

  clearRetryHandlerCount(df);
  df.setParameter('currentZipAndRegions', null);
  df.setParameter('geoInvalid', null);
  df.setParameter('location', null);
  df.setParameter('geography', null);
  df.setParameter('user_actions', null);
  df.setParameter('userCurrentState', sessionInfo.userCurrentState);
};

const preProcessCustomerActions = (customerActions) => {
  if (!customerActions || !Array.isArray(customerActions)) {
    return customerActions;
  }
  return customerActions.reduce((resultArray, currentAction) => {
    if (currentAction && !resultArray.includes(currentAction.toUpperCase())) {
      resultArray.push(currentAction.toUpperCase());
    }
    return resultArray;
  }, []);
};

const executeSingleAction = (action, type, capturedParameters, sessionInfo) => {
  delete capturedParameters.user_actions;
  switch (action) {
    case 'ADD':
      if (sessionInfo.geography && sessionInfo.geography.location) {
        let addedLocation = false;
        sessionInfo.geography.location.forEach((location) => {
          const types = Object.keys(location);
          types.forEach(type => {
            const finalParameterLocationType = sessionInfo.userCurrentState.geography[type] || [];
            const index = finalParameterLocationType.indexOf(location[type]);
            if (index === -1) {
              addedLocation = true;
              finalParameterLocationType.push(location[type]);
            }
            sessionInfo.userCurrentState.geography[type] = finalParameterLocationType;
          });
        });
        if (!addedLocation) {
          sessionInfo.geoInvalid = 'geoAlreadyInList';
          return sessionInfo;
        }
        sessionInfo.populateState = true;
      }
      return sessionInfo;
    case 'REMOVE': {
      const stateValues = sessionInfo.geography.location.filter((_location) => _location.state);
      const otherGeo = sessionInfo.geography.location.filter((_location) => !_location.state);
      let hasUpdated = false;
      for (const location of otherGeo) {
        const types = Object.keys(location);
        types.forEach(type => {
          const finalParameterLocationType = sessionInfo.userCurrentState.geography[type] || [];
          const index = finalParameterLocationType.indexOf(location[type]);
          if (index > -1) {
            // const geoLength = getGeoLength(sessionInfo.userCurrentState.geography, false);
            // if (geoLength > 1) {
            finalParameterLocationType.splice(index, 1);
            hasUpdated = true;
            // } else {
            // sessionInfo.geoInvalid = 'geoCannotRemove';
            // return sessionInfo;
            // }
          } else {
            sessionInfo.geoInvalid = 'geoNotInList';
            return sessionInfo;
          }
          sessionInfo.userCurrentState.geography[type] = finalParameterLocationType;
        });
      }
      for (const location of stateValues) {
        const types = Object.keys(location);
        types.forEach(type => {
          const finalParameterLocationType = sessionInfo.userCurrentState.geography[type] || [];
          const index = finalParameterLocationType.indexOf(location[type]);
          if (index > -1) {
            // const geoLength = getGeoLength(sessionInfo.userCurrentState.geography, true);
            // if (geoLength > 1) {
            finalParameterLocationType.splice(index, 1);
            hasUpdated = true;
            // } else {
            // sessionInfo.geoInvalid = 'geoCannotRemove';
            // return sessionInfo;
            // }
          } else {
            sessionInfo.geoInvalid = 'geoNotInList';
            return sessionInfo;
          }
          sessionInfo.userCurrentState.geography[type] = finalParameterLocationType;
        });
      }
      if (hasUpdated) {
        delete sessionInfo.geoInvalid;
      }
      return sessionInfo;
    }
    case 'UPDATE': {
      const currentLocation = sessionInfo.geography.location;
      const previousLocation = sessionInfo.userCurrentState.geography;
      const { completeIntersection, partialIntersection } = containsWithinPreviousLocation(previousLocation, currentLocation);
      if (completeIntersection) {
        sessionInfo.confirmNewLocation = true;
        return sessionInfo;
      }
      const stateCount = sessionInfo.geography.location.filter((geo) => geo.state).length;
      const otherGeoCount = sessionInfo.geography.location.filter((geo) => !geo.state).length;
      if (sessionInfo.geography.location.length === 0) {
        return sessionInfo;
      }
      if (!(partialIntersection) || (otherGeoCount === 1 && stateCount === 1) || (otherGeoCount + stateCount === 1)) {
        sessionInfo = postProcessGeography(sessionInfo);
        if (otherGeoCount >= 1) {
          sessionInfo.populateState = true;
          sessionInfo.replaceState = true;
        }
        return sessionInfo;
      }
      return updateEntities(type, capturedParameters, sessionInfo);
    }
    default:
      return sessionInfo;
  }
};

const executeDualAction = (df, action, type, capturedParameters, sessionInfo) => {
  let actionType = null;
  delete capturedParameters.user_actions;
  if (action.includes('ADD') && action.includes('UPDATE')) {
    actionType = 'ADDUPDATE';
  }
  if (action.includes('REMOVEUPDATE') && action.includes('UPDATE')) {
    actionType = 'ADDUPDATE';
  }
  if (action.includes('ADD') && action.includes('REMOVE')) {
    actionType = 'ADDREMOVE';
  }
  switch (actionType) {
    case 'ADDUPDATE':
    case 'REMOVEUPDATE':
    case 'ADDREMOVE':
      return updateEntities(type, capturedParameters, sessionInfo);

    default:
      return sessionInfo;
  }
};

const updateEntities = (type, capturedParameters, sessionInfo) => {
  const stateValues = sessionInfo.geography.location.filter((_location) => _location.state);
  const otherGeo = sessionInfo.geography.location.filter((_location) => !_location.state);
  const geography = _.cloneDeep(sessionInfo.userCurrentState.geography);
  sessionInfo.currentZipAndRegions = [];
  for (const location of otherGeo) {
    const types = Object.keys(location);
    types.forEach(type => {
      const finalParameterLocationType = _.cloneDeep(geography[type]) || [];
      const index = finalParameterLocationType.indexOf(location[type]);
      if (index > -1) {
        finalParameterLocationType.splice(index, 1);
      } else {
        if (['zipcode', 'region'].includes(type)) {
          sessionInfo.currentZipAndRegions.push(location[type]);
          sessionInfo.populateState = true;
        }
        finalParameterLocationType.push(location[type]);
      }
      geography[type] = finalParameterLocationType;
    });
  }
  if (otherGeo.length > 0) {
    // const geoLength = getGeoLength(geography, false);
  //   if (geoLength === 0) {
  //     sessionInfo.geoInvalid = 'geoCannotRemove';
  //     return sessionInfo;
  //   }
    sessionInfo.userCurrentState.geography = geography || {};
  }
  const stateGeography = _.cloneDeep(sessionInfo.userCurrentState.geography);
  for (const location of stateValues) {
    const types = Object.keys(location);
    types.forEach(type => {
      const finalParameterLocationType = _.cloneDeep(stateGeography[type]) || [];
      const index = finalParameterLocationType.indexOf(location[type]);
      if (index > -1) {
        finalParameterLocationType.splice(index, 1);
      } else {
        finalParameterLocationType.push(location[type]);
      }
      stateGeography[type] = finalParameterLocationType;
    });
  }
  if (stateValues.length > 0) {
  // const stateLength = getGeoLength(stateGeography, true);
  //   if (stateLength === 0) {
  //     sessionInfo.geoInvalid = 'geoCannotRemove';
  //     return sessionInfo;
  //   }
    sessionInfo.userCurrentState.geography = stateGeography;
  }
  return sessionInfo;
};

/*
const getGeoLength = (currentGeo, isState) => {
  var geoLength = 0;
  for (const geo in currentGeo) {
    if (isState) {
      geoLength += currentGeo.state.length || 0;
      break;
    } else if (geo !== 'state') {
      geoLength += currentGeo[geo].length || 0;
    }
  }
  return geoLength;
};
*/

const containsWithinPreviousLocation = (previousLocation, currentLocation) => {
  let completeIntersection = true;
  let partialIntersection = false;
  for (const location of currentLocation) {
    const locationType = Object.keys(location).pop();
    if (previousLocation[locationType] && Array.isArray(previousLocation[locationType]) &&
      previousLocation[locationType].includes(location[locationType])) {
      partialIntersection = true;
    } else {
      completeIntersection = false;
    }
  }
  return { completeIntersection, partialIntersection };
};

module.exports = modifyGeography;
