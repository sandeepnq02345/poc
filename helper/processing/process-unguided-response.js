'use strict';

const _ = require('lodash');
const template = require('lodash.template');
const messageSkeleton = require('../../data/responses');
const { getPropertiesCount } = require('../query-processor-connector');
const { acknowledgePrefix, ignorePropertyCheckTags } = require('../../config')();
const { resolveStaticParameters } = require('../resolve-interpolated-delimiters');
const { setResponse } = require('../setResponse');
const { retryResponseHandler } = require('../validation/invalid-input');

/**
* It post processes the responses.
* @param {Object} df - df object form the dialogflow.
* @param {Object} currentParameters - current parameter.
* @param {Object} sessionInfo - session information.
*/
const processResponse = (df, currentParameters, sessionInfo) => {
  const responseKeys = df.getResponseKeys();
  const totalResponseLength = responseKeys.errorKeys.length + responseKeys.successKeys.length + responseKeys.confirmation.length;
  if (totalResponseLength <= 1) {
    df.setParameter('hasErrorsUnguided', { count: 0 });
    return;
  }
  if (responseKeys.errorKeys.length >= 1) {
    let errorCount = (currentParameters.hasErrorsUnguided && currentParameters.hasErrorsUnguided.count) || 0;
    df._response.sessionInfo.parameters = currentParameters;
    const errorResponse = messageSkeleton.multipleErrorsGeneric.response[errorCount];
    const compiled = template(errorResponse);
    const responseMessage = compiled({ name: sessionInfo.name });
    df.overrideResponseText([responseMessage], errorResponse);
    df.setParameter('location', null);
    df.setParameter('modify_filters', null);
    errorCount = (errorCount + 1) % 2;
    df.setParameter('hasErrorsUnguided', { count: errorCount });
  } else if (responseKeys.confirmation.length >= 1) {
    df.setParameter('hasErrorsUnguided', { count: 0 });
    df.overrideResponseText([responseKeys.confirmation[0].compiledResponse]);
  } else {
    const isNotFilter = [];
    let checkIfNotFilter = false;
    let checkIfInitialGeography = false;
    let successResponse = '';
    let templateResponseKey = responseKeys.successKeys.map((el) => el.key);
    templateResponseKey = [...new Set(templateResponseKey)];
    let message = (_.isEmpty(templateResponseKey)) ? 'modifyFilters' : '';
    checkIfInitialGeography = templateResponseKey.indexOf('initialGeography') !== -1;
    for (const x of templateResponseKey) {
      isNotFilter.push(['modifyFilters', 'firstPropertyValueRange', 'firstPropertyValueGt', 'firstPropertyValueLt', 'modifiedGeography'].includes(x));
    }
    checkIfNotFilter = isNotFilter.indexOf(true) === -1;
    if (checkIfInitialGeography) {
      message = 'unguidedInitialGeography';
    } else {
      if (message !== 'modifyFilters') { message = (checkIfNotFilter) ? 'transactionTypeModified' : 'modifyFilters'; }
    }
    if (messageSkeleton[message].response.length > 0) {
      successResponse = messageSkeleton[message].response[Math.floor(Math.random() * messageSkeleton[message].response.length)];
    } else {
      successResponse = messageSkeleton[message].response[0];
    }
    const [minPropensity, maxPropensity] = [sessionInfo.userCurrentState.propensity && sessionInfo.userCurrentState.propensity.min, sessionInfo.userCurrentState.propensity && sessionInfo.userCurrentState.propensity.max];
    const compiled = template(successResponse);
    const randomPrefix = acknowledgePrefix[Math.floor(Math.random() * acknowledgePrefix.length)];
    const values = { propertiesCount: Math.floor(Math.random() * 1000) + 1, minPropensity: minPropensity, maxPropensity: maxPropensity, ackPrefix: randomPrefix };
    const responseMessage = compiled(values);
    successResponse = resolveStaticParameters(successResponse, values);
    df.setParameter('hasErrorsUnguided', { count: 0 });
    df.overrideResponseText([responseMessage], successResponse);
  }
};

/* const getRequiredDynamicValues = (responseTemplate) => {
  let requiredDynamicValues = [];
  for (const _response of responseTemplate) {
    const interpolatedKey = _response.match(/<%=[A-Z|a-z| ]*%>/g);
    if (interpolatedKey) {
      const dynamicValues = interpolatedKey.map(val => val.replace(/<%=|%>/g, '').trim());
      requiredDynamicValues.push(...dynamicValues);
    }
  }
  requiredDynamicValues = Array.from(new Set(requiredDynamicValues));
  return requiredDynamicValues;
}; */

const processUnguidedResponse = async (df, sessionInfo, sessionParamsBeforeProcessing) => {
  const responseKeys = df.getResponseKeys();
  const requestTag = df.getRequestTag();
  if (ignorePropertyCheckTags.includes(requestTag)) {
    df.setParameter('processedFilters', null);
    return;
  }

  const totalResponseLength = responseKeys.errorKeys.length + responseKeys.successKeys.length + responseKeys.confirmation.length;
  const isUnguided = (totalResponseLength > 1);
  const hasErrors = !!(responseKeys.errorKeys.length);
  const hasFollowUps = !!(responseKeys.confirmation.length);

  if (isUnguided) {
    df.setParameter('processedFilters', ['default']);
    if (hasErrors) {
      df.setResponseParameters(sessionParamsBeforeProcessing);
      cleanCapturedParameters(df);
      if (responseKeys.errorKeys.length === 1) {
        df.overrideResponse(responseKeys.errorKeys[0].compiledResponse);
      } else {
        df.clearResponseQueue();
        retryResponseHandler(df, 'unguided');
      }
    } else if (hasFollowUps) {
      if (responseKeys.confirmation.length === 1) {
        df.overrideResponse(responseKeys.confirmation[0].compiledResponse);
      } else {
        df.setResponseParameters(sessionParamsBeforeProcessing);
        df.setParameter('captured_filters', null);
        df.setParameter('location', null);
        df.setParameter('lien_state', null);
        df.clearResponseQueue();
        retryResponseHandler(df, 'unguided');
      }
    } else {
      df.clearResponseQueue();
      setResponse(df, 'modifyFiltersSuccess');
      cleanCapturedParameters(df);
    }
  }
};

/**
* It post processes the responses.
* @param {Object} df - df object form the dialogflow.
* @param {Object} sessionInfo - session information.
*/
const postProcessResponse = async (df, sessionInfo) => {
  const responseKeys = df.getResponseKeys();
  const requestTag = df.getRequestTag();
  if (ignorePropertyCheckTags.includes(requestTag)) {
    df.setParameter('processedFilters', null);
    return;
  }

  const propertiesCount = await getPropertiesCount(sessionInfo.queryId, sessionInfo['use_case']);
  const processedFilters = (sessionInfo.processedFilters && sessionInfo.processedFilters[0]) || 'default';
  if (propertiesCount === 0 && !responseKeys.confirmation.length && !responseKeys.errorKeys.length) {
    df.overrideResponse('Interesting.');
    let responseKey;
    switch (processedFilters) {
      case 'involuntaryLiens':
      case 'lienType':
        responseKey = 'lienTypeError';
        break;
      case 'equity':
        responseKey = 'equityError';
        break;
      case 'lienToValueRatio':
      case 'loanToValue':
        responseKey = 'lienToValueRatioError';
        break;
      case 'lienAmount':
      case 'propertyValue':
        responseKey = 'lienAmountError';
        break;
      case 'lienOrReleaseRecordingDate':
        responseKey = 'lienOrReleaseRecordingDateError';
        break;
      case 'geography':
        responseKey = 'geographyError';
        break;
      default:
        responseKey = 'catchAllError';
        break;
    }
    setResponse(df, responseKey);
    setResponse(df, 'whatElse');
  }
  df.setParameter('processedFilters', null);
};

const cleanCapturedParameters = (df) => {
  df.setParameter('captured_filters', null);
  df.setParameter('location', null);
  df.setParameter('lien_state', null);
};

module.exports = { processResponse, postProcessResponse, processUnguidedResponse };
