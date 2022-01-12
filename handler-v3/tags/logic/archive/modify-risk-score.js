'use strict';

/**
 * Modify Risk Score controller
 * @param {object} df webhook fulfillment object
 */
const _ = require('lodash');
const config = require('../../../config')();
const { risks, sliderMinMax, sliderDefault } = config;
const { setMappingRiskRange, updateMappingRiskRange } = require('../../../helper/mapping-helper');
const { operationsRisk } = require('../../../helper/modify-operations');
const { setInvalidInputCount, clearInvalidInput } = require('../../../helper/validation/invalid-input');

const modifyRiskScore = async (df, sessionInfo, filter) => {
  let result = {};
  const capturedParameters = _.cloneDeep(filter);
  let userCurrentState = sessionInfo.userCurrentState || {};
  const predicate = capturedParameters.predicate || 'and';
  const risk = sessionInfo.userCurrentState.risk;
  if (capturedParameters.risk_type) {
    if (capturedParameters.risk_type === 'score') {
      result.isValid = false;
      result.response = 'noRiskMentioned';
      return result;
    }
    if (capturedParameters.risk_type === 'risk') {
      if (risk) {
        let isStatusTrue = false;
        for (const obj in risk) {
          if (risk[obj].status === true) {
            capturedParameters.risk_type = obj;
            isStatusTrue = true;
            break;
          }
        }
        if (!isStatusTrue) {
          result.isValid = false;
          result.response = 'noRiskMentioned';
          return result;
        }
      } else if (risk === undefined) {
        result.isValid = false;
        result.response = 'noRiskMentioned';
        return result;
      }
    }
  }
  for (const riskType of risks) {
    if (capturedParameters.risk_type === riskType) {
      if (!risk || !risk[riskType]) {
        if (capturedParameters.remove) {
          result.isValid = false;
          result.response = 'invalidRemoveAction';
          result.responseParams = { name: sessionInfo['given-name'] };
          return result;
        } else {
          if (risk) userCurrentState = clearStatus(userCurrentState);
          userCurrentState = _.merge(userCurrentState, {
            risk: {
              [riskType]: {
                status: false,
                min: sliderDefault.risk.min,
                max: sliderDefault.risk.max,
                predicate
              }
            }
          });
        }
      }
      result = await updateRiskScore(df, capturedParameters, userCurrentState, riskType, sessionInfo, result);
      if (result.isValid) {
        clearInvalidInput(df, 'risk');
        df.setParameter('userCurrentState', result.userCurrentState);
        if (userCurrentState.risk[riskType]) {
          result.payload = {};
          result.payload[riskType] = userCurrentState.risk[riskType];
        }
        return result;
      }
    };
  };
  df.setParameter('customer_action', null);
  return result;
};

const updateRiskScore = (df, parameters, userCurrentState, riskType, sessionInfo, result) => {
  const predicate = parameters.predicate;
  const riskStart = sliderMinMax.risk.min;
  const riskEnd = sliderMinMax.risk.max;
  const resultRemoveRiskLayer = {
    isValid: true,
    response: 'removeRiskLayer',
    responseParams: { propertiesCount: Math.floor(Math.random() * 1000) + 1 },
    userCurrentState: userCurrentState
  };
  if (userCurrentState.risk && userCurrentState.risk[riskType]) {
    userCurrentState.risk[riskType].predicate = predicate || userCurrentState.risk[riskType].predicate;
  }
  if (parameters.range) {
    if (parameters.range.value < riskStart || parameters.range.value > riskEnd || parameters.range.min < riskStart || parameters.range.min > riskEnd || parameters.range.max < riskStart || parameters.range.max > riskEnd || parameters.original.indexOf('%') > -1 || parameters.original.indexOf('percent') > -1 || parameters.original.indexOf('percentage') > -1) {
      setInvalidInputCount(df, 'risk', 'getValidRiskRange');
      return {
        isValid: false
      };
    }
  }
  if (!parameters.remove) {
    if (userCurrentState.risk && userCurrentState.risk[riskType]) {
      if (userCurrentState.risk[riskType].status && !parameters.range && !parameters.mapping) {
        result.isValid = false;
        result.response = 'criteriaAlreadyApplied';
        result.responseParams = { name: sessionInfo['given-name'] };
        return result;
      } else {
        userCurrentState = clearStatus(userCurrentState);
        userCurrentState.risk[riskType].status = true;
      }
    }
    if (parameters.range) {
      if (parameters.range.operator || (!parameters.range.operator && parameters.operator)) {
        if (parameters.operator) { parameters.range.operator = parameters.operator; }
        if (parameters.range.operator === 'around') userCurrentState = updateMappingRiskRange(parameters, userCurrentState, riskType);
        else { userCurrentState = operationsRisk.withoutCustomerAction[parameters.range.operator](parameters.range, userCurrentState, riskType); }
      } else if (parameters.range.value && !parameters.range.operator) {
        userCurrentState = updateMappingRiskRange(parameters, userCurrentState, riskType);
      } else {
        userCurrentState.risk[riskType].min = parameters.range.min;
        userCurrentState.risk[riskType].max = parameters.range.max;
      }
    } else if (parameters.mapping) {
      userCurrentState = setMappingRiskRange(parameters.mapping.toUpperCase(), userCurrentState, riskType);
    }
  } else {
    if (!parameters.mapping && !parameters.range && !parameters.operator) {
      if (userCurrentState.risk[riskType] && userCurrentState.risk[riskType].status) {
        userCurrentState.risk[riskType].status = false;
        return resultRemoveRiskLayer;
      } else if (!sessionInfo.userCurrentState.risk[riskType]) {
        result.isValid = false;
        result.response = 'invalidRemoveAction';
        result.responseParams = { name: sessionInfo['given-name'], risk: riskType };
        return result;
      } else {
        result.isValid = false;
        result.response = 'layerNotActive';
        return result;
      }
    } else if (!parameters.range && parameters.operator) {
      userCurrentState = clearStatus(userCurrentState);
      userCurrentState.risk[riskType].status = true;
      if (parameters.operator === 'greater than') userCurrentState.risk[riskType].min = riskStart;
      else if (parameters.operator === 'less than') userCurrentState.risk[riskType].max = riskEnd;
      return resultRemoveRiskLayer;
    } else if (parameters.range) {
      clearStatus(userCurrentState);
      userCurrentState.risk[riskType].status = true;
      if (parameters.range.operator || (!parameters.range.operator && parameters.operator)) {
        if (parameters.operator) { parameters.range.operator = parameters.operator; }
        userCurrentState = operationsRisk.withCustomerAction[parameters.range.operator](parameters.range, userCurrentState, riskType);
      }
    }
  };
  result.isValid = true;
  result.userCurrentState = userCurrentState;
  return result;
};

const clearStatus = (userCurrentState) => {
  risks.forEach((riskType) => {
    if (userCurrentState.risk[riskType]) { userCurrentState.risk[riskType].status = false; }
  });
  return userCurrentState;
};

module.exports = { modifyRiskScore };
