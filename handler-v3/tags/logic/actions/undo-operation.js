'use strict';

const { setResponse } = require('../../../../helper/setResponse');
const logger = require('../../../../lib/logger');
const { getSessionStateByUsername } = require('../../../../helper/query-processor-connector');
const { hasStateParamsChanged } = require('../../../../helper/detect-change');
const _ = require('lodash');
/**
 * Undo operation controller
 * @param {object} df webhook fulfillment object
 * @param {object} sessionInfo df parameters
 */

const undoOperation = async (df, sessionInfo) => {
  const count = sessionInfo.undoCount ? sessionInfo.undoCount : 0;
  const userId = sessionInfo.userId;
  const sessionId = sessionInfo.sessionId;

  const previousQueryParams = await getSessionStateByUsername(userId, sessionId, 2 * (count) + 1);
  const currentStateParams = processDateFields(sessionInfo.userCurrentState);

  if (!previousQueryParams || !hasStateParamsChanged(previousQueryParams.stateParameters, currentStateParams)) {
    setResponse(df, 'invalidUndo');
    logger.log('error', 'This operation cannot be performed as there are no previous Queries');
    return;
  }

  df.setParameter('userCurrentState', previousQueryParams.stateParameters);
  df.setParameter('undoCount', count + 1);
  setResponse(df, 'modifyFiltersSuccess');
};

const processDateFields = (userCurrentState) => {
  const processedParameters = _.cloneDeep(userCurrentState);
  if (!processedParameters || typeof processedParameters !== 'object') {
    return processedParameters;
  }

  for (const key in processedParameters) {
    if (['startDate', 'endDate'].includes(key)) {
      processedParameters[key] = (processedParameters[key].slice(-1) === 'Z')
        ? processedParameters[key].slice(0, -1) : processedParameters[key];
    }

    if (typeof processedParameters[key] === 'object') {
      processedParameters[key] = processDateFields(processedParameters[key]);
    }
  }
  return processedParameters;
};

module.exports = undoOperation;
