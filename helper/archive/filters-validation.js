'use strict';

const clearFilter = require('../../handler-v3/tags/logic/actions/clear-filters');
const clearValues = require('../../handler-v3/tags/logic/actions/clear-values');
const { validateRemoveAction } = require('./validate-remove-action');

module.exports = async (df, filter, filterType, sessionInfo, filterCount, bypassConfirmation) => {
  const result = {
    isValid: true
  };
  const resultInvalidRemoveAction = {
    isValid: false,
    response: 'invalidRemoveAction',
    responseParams: { name: sessionInfo['user_name'], filter: filter.filters }
  };
  if (Array.isArray(filter.filters)) {
    result.isValid = false;
    result.response = 'rangeWithFilter';
    return result;
  }
  if (filter.remove) {
    if (filter.filters) {
      if (!filter.operator && !filter.range) {
        if (!sessionInfo.askClearConfirmation && filterCount === 1 && !bypassConfirmation) {
          df.setParameter('askClearConfirmation', true);
          result.isValid = false;
          result.response = 'confirmClearFilter';
          result.responseParams = { filter: (filter.filters === 'property') ? 'property value' : filter.filters };
          return result;
        } else {
          df.setParameter('askClearConfirmation', null);
          sessionInfo.filters = filter.filters;
          if (validateRemoveAction(df, filterType)) {
            clearFilter(df, sessionInfo);
            result.isValid = false;
            result.response = 'modifyFilters';
            result.responseParams = { propertiesCount: Math.floor(Math.random() * 1000) + 1 };
            result.processOtherParams = true;
            return result;
          } else return resultInvalidRemoveAction;
        }
      } else if (filter.operator && !filter.range) {
        sessionInfo.operator = filter.operator;
        if (validateRemoveAction(df, filterType)) {
          const resultClearValues = await clearValues(df, sessionInfo, filter.filters);
          if (resultClearValues.isValid) {
            result.isValid = false;
            result.response = 'modifyFilters';
            result.responseParams = { propertiesCount: Math.floor(Math.random() * 1000) + 1 };
            return result;
          } else {
            result.isValid = false;
            result.response = resultClearValues.response;
            return result;
          }
        } else return resultInvalidRemoveAction;
      }
    } else {
      result.isValid = false;
      result.response = 'noFilterCaptured';
      return result;
    }
  } else {
    if (!filter.filters) {
      return {
        isValid: false,
        response: 'noFilterCaptured',
        responseParams: { name: sessionInfo['user_name'] }
      };
    }
    if (filter.operator && filter.filters && !filter.range) {
      return {
        isValid: false,
        response: 'getRange',
        responseParams: { name: sessionInfo['user_name'] }
      };
    }
  }
  return result;
};
