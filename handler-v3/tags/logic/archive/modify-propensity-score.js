'use strict';

/**
 * Modify Propensity Score controller
 * @param {object} df webhook fulfillment object
 */
const config = require('../../../config')();
const { sliderDefault, sliderMinMax } = config;
const { updateMappingRange, setMappingRange, propensityMapping } = require('../../../helper/mapping-helper');
const { operationsAll } = require('../../../helper/modify-operations');
const _ = require('lodash');
const { setInvalidInputCount, clearInvalidInput } = require('../../../helper/validation/invalid-input');

const modifyPropensityScore = async (df, sessionInfo, filter) => {
  let result = {};
  const capturedParameters = _.cloneDeep(filter);
  const predicate = capturedParameters.predicate || 'and';
  let userCurrentState = sessionInfo.userCurrentState || {};
  const propensity = sessionInfo.userCurrentState.propensity;
  if (!propensity) {
    userCurrentState = _.merge(userCurrentState, {
      propensity: {
        min: sliderDefault.propensity.min,
        max: sliderDefault.propensity.max,
        predicate
      }
    });
    if ((!capturedParameters.mapping && !capturedParameters.range)) {
      result.isValid = false;
      result.response = 'propensityDefault';
      return result;
    }
  } else if (propensity && !capturedParameters.range && !capturedParameters.mapping) {
    result.isValid = false;
    result.response = 'criteriaAlreadyApplied';
    result.responseParams = { name: sessionInfo['given-name'] };
    return result;
  }
  result = await updatePropensityScore(df, capturedParameters, userCurrentState, sessionInfo, propensity, result);
  if (result.isValid) {
    clearInvalidInput(df, 'propensity');
    df.setParameter('userCurrentState', result.userCurrentState);
    if (propensity) {
      result.payload = {};
      result.payload.propensity = propensity;
    }
  }
  return result;
};

const updatePropensityScore = (df, parameters, userCurrentState, sessionInfo, propensity, result) => {
  const propensityStart = sliderMinMax.propensity.min;
  const propensityEnd = sliderMinMax.propensity.max;
  if (propensity) {
    const predicate = parameters.predicate;
    propensity.predicate = predicate || propensity.predicate;
  }
  if (parameters.range) {
    if (parameters.range.value < propensityStart || parameters.range.value > propensityEnd || parameters.range.min < propensityStart || parameters.range.min > propensityEnd || parameters.range.max < propensityStart || parameters.range.max > propensityEnd || ((parameters.operator === 'less than' || parameters.range.operator === 'less than') && parameters.range.value === propensityStart) || (parameters.range.min !== undefined && parameters.range.min === parameters.range.max)) {
      setInvalidInputCount(df, 'propensity', 'getValidPropensityRange');
      result.isValid = false;
      return result;
    }
    if (parameters.range.min > parameters.range.max) {
      parameters.range.min = parameters.range.min + parameters.range.max;
      parameters.range.max = parameters.range.min - parameters.range.max;
      parameters.range.min = parameters.range.min - parameters.range.max;
    }
  }
  if (!parameters.remove) {
    if (parameters.range) {
      if (parameters.range.operator || (!parameters.range.operator && parameters.operator)) {
        if (parameters.operator) { parameters.range.operator = parameters.operator; }
        if (parameters.range.operator === 'around') userCurrentState = updateMappingRange(parameters, _.cloneDeep(userCurrentState));
        else { userCurrentState = operationsAll.withoutCustomerAction[parameters.range.operator](parameters.range, userCurrentState, 'propensity'); }
      } else if (parameters.range.value && !parameters.range.operator) {
        userCurrentState = updateMappingRange(parameters.range, _.cloneDeep(userCurrentState));
      } else {
        propensity.min = parameters.range.min;
        propensity.max = parameters.range.max;
      }
    } else if (parameters.mapping) {
      if (parameters.mapping.toUpperCase() in propensityMapping) userCurrentState = setMappingRange(parameters.mapping.toUpperCase(), _.cloneDeep(userCurrentState));
      else {
        result.isValid = false;
        result.response = 'noMappingExists';
        result.responseParams = { name: sessionInfo['given-name'] };
        return result;
      }
    }
  } else {
    if (parameters.range) {
      if (parameters.range.operator || (!parameters.range.operator && parameters.operator)) {
        if (parameters.operator) { parameters.range.operator = parameters.operator; }
        userCurrentState = operationsAll.withCustomerAction[parameters.range.operator](parameters.range, userCurrentState, 'propensity');
      }
    }
  }
  result.isValid = true;
  result.userCurrentState = userCurrentState;
  return result;
};

module.exports = { modifyPropensityScore };
