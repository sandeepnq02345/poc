'use strict';

const { setResponse } = require('../../../../helper/setResponse');
const { setInvalidInputCount, clearInvalidInput } = require('../../../../helper/validation/invalid-input');
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
  if ((sessionInfo.location && !sessionInfo.location.length) &&
        (sessionInfo.lien_state && !sessionInfo.lien_state.length)) {
    setInvalidInputCount(df, 'geo', 'invalidGeography');
    df.setParameter('user_actions', null);
    return;
  }

  if (sessionInfo.lien_state && sessionInfo.lien_state.length > 0) {
    const geographyObject = {
      geography: {
        state: []
      }
    };
    sessionInfo.lien_state = _.uniqBy(sessionInfo.lien_state);
    if (sessionInfo.lien_state.length === 1) {
      geographyObject.geography.state = constant[sessionInfo.lien_state[0]];
    } else if (sessionInfo.lien_state.length === 2) {
      const commonStates = constant[sessionInfo.lien_state[0]].filter(state => constant[sessionInfo.lien_state[1]].includes(state));
      geographyObject.geography.state = commonStates;
    } else {
      df.setResponse(df, 'complexQuery');
      return;
    }
    sessionInfo.userCurrentState = { ...sessionInfo.userCurrentState, ...geographyObject };
    setResponse(df, 'modifyGeographySuccess');
    df.setParameter('lien_state', null);
    df.setParameter('user_actions', null);
    return;
  }

  if (!sessionInfo.userCurrentState) {
    sessionInfo.userCurrentState = {};
    if (!sessionInfo.userCurrentState.geography) {
      sessionInfo.userCurrentState.geography = {};
    }
  }
  sessionInfo = await preprocessGeography(sessionInfo);
  // const entities = df.getIntentParameters();
  const entities = {
    location: sessionInfo.location,
    user_actions: sessionInfo.user_actions
  };
  const customerActions = preProcessCustomerActions(sessionInfo.user_actions);
  sessionInfo.confirmNewLocation = false;

  if (sessionInfo.geography && sessionInfo.geography.location) {
    const stateValues = sessionInfo.geography.location.filter((geo) => geo.state);
    const otherGeo = sessionInfo.geography.location.filter((geo) => !geo.state);
    const customerActionsLength = (customerActions && customerActions.length);

    if (customerActionsLength === 1) {
      sessionInfo = executeSingleAction(customerActions[0], TYPE.GEOGRAPHY, entities, sessionInfo, stateValues, otherGeo);
    } else if (customerActionsLength === 2) {
      if (sessionInfo.geography.location.length > 2) {
        setResponse(df, 'confirmGeographyToAdd');
        delete sessionInfo.currentZipAndRegions;
        df.setParameter('addGeoConfirmation', true);
        return;
      }
      sessionInfo = executeDualAction(customerActions, TYPE.GEOGRAPHY, entities, sessionInfo, stateValues, otherGeo);
    } else {
      sessionInfo = postProcessGeography(sessionInfo);
      sessionInfo.userCurrentState = await populateState(sessionInfo, true);
    }
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
    (sessionInfo.geoInvalid) ? setResponse(df, sessionInfo.geoInvalid, { name: sessionInfo['given-name'] }) : setResponse(df, 'modifiedGeography', { propertiesCount: Math.floor(Math.random() * 1000) + 1 });
    df.setParameter('confirmNewLocation', false);
  }

  df.setParameter('currentZipAndRegions', null);
  df.setParameter('geoInvalid', null);
  df.setParameter('location', null);
  df.setParameter('geography', null);
  df.setParameter('user_actions', null);
  clearInvalidInput(df, 'geo');
  df.setParameter('userCurrentState', sessionInfo.userCurrentState);
};

const preProcessCustomerActions = (userActions) => {
  if (!userActions || !Array.isArray(userActions)) {
    return userActions;
  }
  return userActions.reduce((resultArray, currentAction) => {
    if (currentAction && !resultArray.includes(currentAction.toUpperCase())) {
      resultArray.push(currentAction.toUpperCase());
    }
    return resultArray;
  }, []);
};

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

const updateSessionInfo = (sessionInfo, location, actionType, actionFlag = false) => {
  const types = Object.keys(location);
  types.forEach(type => {
    const finalParameterLocationType = sessionInfo.userCurrentState.geography[type] || [];
    const index = finalParameterLocationType.indexOf(location[type]);
    if (actionType === 'ADD' && index === -1) { // TODO: see if it can be further optimized
      actionFlag = true;
      finalParameterLocationType.push(location[type]);
    } else {
      if (index > -1) {
        const geoLength = getGeoLength(sessionInfo.userCurrentState.geography, actionFlag);
        if (geoLength > 1) {
          finalParameterLocationType.splice(index, 1);
          actionFlag = true;
        } else {
          sessionInfo.geoInvalid = 'geoCannotRemove';
          return sessionInfo;
        }
      } else {
        sessionInfo.geoInvalid = 'geoNotInList';
        return sessionInfo;
      }
    }
    sessionInfo.userCurrentState.geography[type] = finalParameterLocationType;
  });
};

const executeSingleAction = (action, type, entities, sessionInfo, stateValues, otherGeo) => {
  delete entities.user_actions;
  switch (action) {
    case 'ADD': {
      const addedLocation = false;
      sessionInfo.geography.location.forEach((location) => {
        updateSessionInfo(sessionInfo, location, action);
      });
      if (!addedLocation) {
        sessionInfo.geoInvalid = 'geoAlreadyInList';
        return sessionInfo;
      }
      sessionInfo.populateState = true;
      return sessionInfo;
    }
    case 'REMOVE': {
      const hasUpdated = false;
      // TODO: see if we can combine these 2 for loops
      for (const location of otherGeo) {
        updateSessionInfo(sessionInfo, location, action, hasUpdated);
      }
      for (const location of stateValues) {
        updateSessionInfo(sessionInfo, location, action, !hasUpdated);
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
      const stateCount = stateValues.length;
      const otherGeoCount = otherGeo.length;
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
      return updateEntities(type, entities, sessionInfo);
    }
    default:
      return sessionInfo;
  }
};

const updateGeography = (sessionInfo, geoArray, geographyType, updateGeo) => {
  for (const location of geoArray) {
    const types = Object.keys(location);
    types.forEach(type => {
      const finalParameterLocationType = _.cloneDeep(geographyType[type]) || [];
      const index = finalParameterLocationType.indexOf(location[type]);
      if (index > -1) {
        finalParameterLocationType.splice(index, 1);
      } else {
        if (updateGeo && ['zipcode', 'region'].includes(type)) {
          sessionInfo.currentZipAndRegions.push(location[type]);
          sessionInfo.populateState = true;
        } else {
          finalParameterLocationType.push(location[type]);
        }
        finalParameterLocationType.push(location[type]);
      }
      geographyType[type] = finalParameterLocationType;
    });
  }

  if (geoArray.length > 0) {
    const length = getGeoLength(geographyType, false);
    if (length === 0) {
      sessionInfo.geoInvalid = 'geoCannotRemove';
      return sessionInfo;
    }
    sessionInfo.userCurrentState.geography = geographyType || {};
  }
};

const updateEntities = (sessionInfo, stateValues, otherGeo) => {
  const geography = _.cloneDeep(sessionInfo.userCurrentState.geography);
  sessionInfo.currentZipAndRegions = [];
  updateGeography(sessionInfo, otherGeo, geography, true);

  const stateGeography = _.cloneDeep(sessionInfo.userCurrentState.geography); // TODO: check if we can remove this
  updateGeography(sessionInfo, stateValues, stateGeography, false);

  return sessionInfo;
};

// if add-add, remove-remove, update-update actions do not come in df, we can remove this function
const executeDualAction = (action, type, entities, sessionInfo, stateValues, otherGeo) => {
  let actionType = null;
  delete entities.user_actions;
  if (action.includes('ADD') && action.includes('UPDATE')) {
    actionType = 'ADDUPDATE';
  }
  if (action.includes('REMOVE') && action.includes('UPDATE')) {
    actionType = 'REMOVEUPDATE';
  }
  if (action.includes('ADD') && action.includes('REMOVE')) {
    actionType = 'ADDREMOVE';
  }
  switch (actionType) {
    case 'ADDUPDATE':
    case 'REMOVEUPDATE':
    case 'ADDREMOVE':
      return updateEntities(sessionInfo, stateValues, otherGeo);

    default:
      return sessionInfo;
  }
};

const containsWithinPreviousLocation = (previousLocation, currentLocation) => {
  let completeIntersection = true;
  let partialIntersection = false;
  for (const location of currentLocation) {
    const locationType = Object.keys(location).pop();
    if (previousLocation[locationType] && Array.isArray(previousLocation[locationType]) && previousLocation[locationType].includes(location[locationType])) {
      partialIntersection = true;
    } else {
      completeIntersection = false;
    }
  }
  return { completeIntersection, partialIntersection };
};

module.exports = modifyGeography;
