'use strict';

const WebhookFulfillment = require('../lib/dialogflow-fulfillment-builder-v3');
const logger = require('../lib/logger');
const config = require('../config')();
const { staticResponses, propensityIntentsFAQ, ignoreBuildTags } = config;
const tagMapper = require('./tags/tag-mapper');
const _ = require('lodash');
const { hasStateParamsChanged } = require('../helper/detect-change');
const { processStateParams } = require('../helper/processing/process-state-params');
const { postProcessResponse, processUnguidedResponse } = require('../helper/processing/process-unguided-response');
const { submitMultimodalQuery, getSessionStateByUsername } = require('../helper/query-processor-connector');

/**
 * Dialogflow cx fulfillment controller
 * @param {object} req http request
 * @param {object} res http response
 * @param {object} services access database connection object configured
 */

module.exports = async (req, res, services) => {
  const fulfillment = new WebhookFulfillment(config.fulfillmentConfigV3, req.body);
  const requestTag = req.body.fulfillmentInfo.tag;
  let dfSessionParameters = req.body.sessionInfo.parameters || {};
  logger.log('info', 'Session Parameters Captured', requestTag, { dfSessionParameters });

  const sessionId = req.body.sessionInfo.session.split('/').reverse()[0];
  const userId = (sessionId && sessionId.split('|').length > 1) ? sessionId.split('|')[0] : 'dfAgentTest';
  const isAgent = !!(userId === 'dfAgentTest');
  const sessionParamsBeforeProcessing = _.cloneDeep(dfSessionParameters);
  let currentStateParams;

  // This retrieves the latest state parameters given the frontend may submitted and executed queries directly with the query processor
  // Reconciles differences in final parameters
  if (!isAgent) {
    logger.log('debug', `GETTING SESSION STATE FROM QUERY PROCESSOR for userId: ${userId}`);
    let { stateParameters: currentStateParams, id: queryId } = await getSessionStateByUsername(userId) || { stateParameters: {} };
    if (!dfSessionParameters.isFirstRequest && queryId) {
      dfSessionParameters.userId = userId;
      dfSessionParameters.sessionId = sessionId;
      dfSessionParameters.isFirstRequest = true;
      currentStateParams = {};
      const timestamp = getTimestampFromQueryId(queryId);
      const lastLoginDate = new Date(timestamp).toISOString();
      dfSessionParameters.lastLoginDate = lastLoginDate;
    }

    // TODO: Don't update in case of first user query
    if (currentStateParams) {
      dfSessionParameters.userCurrentState = _.cloneDeep(currentStateParams);
      sessionParamsBeforeProcessing.userCurrentState = _.cloneDeep(currentStateParams);
      logger.log('debug', 'Updated session state using findByUsername Api', null, dfSessionParameters.userCurrentState);
    }
  } else {
    currentStateParams = _.cloneDeep(dfSessionParameters.userCurrentState);
    if (!dfSessionParameters.isFirstRequest) {
      dfSessionParameters.userId = userId;
      dfSessionParameters.sessionId = sessionId;
      dfSessionParameters.isFirstRequest = true;
    }
  }

  const intentDisplayName = fulfillment.getIntentDisplayName() || '';
  const checkIfContext = propensityIntentsFAQ.includes(intentDisplayName);
  if (checkIfContext) dfSessionParameters.context = intentDisplayName;

  if (requestTag === staticResponses.requestTag) {
    const result = fulfillment.getCompiledResponse();
    return res.status(200).send(result);
  }
  const tag = await tagMapper(requestTag);
  if (!tag) {
    throw new Error(`${requestTag} Tag not defined in tag mapper`);
  }

  await tag(fulfillment, dfSessionParameters);
  if (!checkIfContext) dfSessionParameters.context = null;

  await processUnguidedResponse(fulfillment, dfSessionParameters, sessionParamsBeforeProcessing);

  // Remove undoCount if tag is not `undo_operation`
  if (requestTag !== 'undo_operation') {
    dfSessionParameters.undoCount = null;
  };

  dfSessionParameters = fulfillment.getCurrentSessionParameters();
  dfSessionParameters.userCurrentState = processStateParams(fulfillment, dfSessionParameters.userCurrentState);
  if (hasStateParamsChanged(currentStateParams, dfSessionParameters.userCurrentState) && !ignoreBuildTags.includes(requestTag)) {
    await submitMultimodalQuery(fulfillment, dfSessionParameters);
  }
  if (!isAgent) await postProcessResponse(fulfillment, dfSessionParameters);
  const result = fulfillment.getCompiledResponse();
  res.status(200).json(result);
};

const getTimestampFromQueryId = (queryId) => {
  const timestamp = queryId.split('-');
  timestamp.shift();
  return timestamp.join('-');
};
