'use strict';
const appConstants = require('./response-builder/constants');
const _ = require('lodash');
const logger = require('../logger');

class DialogflowFulfillmentV3 {
  /**
   * The object of this DialogflowFulfillment class can be used to call all the functions of this class
   * @param {Object} config config object which has the platformsEnabled array
   * @example
   * {
   *     "platformsEnabled": [ "TEXT", "ACTIONS_ON_GOOGLE", "FACEBOOK_MESSENGER", "TELEPHONY" ]
   * }
   * @param {Object} request Dialogflow Fulfillment request object
   */

  constructor (config, request) {
    if (config.platformsEnabled && config.platformsEnabled.length > 0) {
      config.platformsEnabled.forEach(platform => {
        if (appConstants.platformSupport.indexOf(platform) < 0) {
          throw new Error(`platform - ${platform} not supported`);
        }
      });
      this._config = config;
      this._responseType = {
        errorKeys: [],
        successKeys: [],
        confirmation: []
      };
      this._messageTemplate = [];
      this._request = request;
      this._response = {
        sessionInfo: request.sessionInfo,
        fulfillmentResponse: {
          messages: []
        }
      };
      if (!this._response.sessionInfo.parameters) { this._response.sessionInfo.parameters = {}; }
    } else {
      throw new Error('Malformed parameters');
    }
  }

  getUserUtterance () {
    return this._request.text;
  }

  getRequestTag () {
    return this._request.fulfillmentInfo.tag;
  }

  getResponseKeys () {
    return this._responseType;
  }

  getResponseQueueLength () {
    return this._response.fulfillmentResponse.messages.length || 0;
  }

  getTemplateResponse () {
    return this._messageTemplate;
  }

  getStateParams () {
    return this._response.sessionInfo.parameters.userCurrentState || {};
  }

  getIntentDisplayName () {
    if (this._request.intentInfo) return this._request.intentInfo.displayName;
  }

  getCurrentSessionParameters () {
    return this._response.sessionInfo.parameters;
  }

  getIntentParameters () {
    const intentParamsReq = this._request.intentInfo.parameters;
    const intentParamsResult = {};
    for (const param in intentParamsReq) {
      intentParamsResult[param] = intentParamsReq[param].resolvedValue;
    }
    return intentParamsResult;
  }

  /**
     * getCompiledResponse compiles the entire webhook response built and returns it
     * @returns {Object} Fulfillment Response sent to Dialogflow
     */
  getCompiledResponse () {
    return this._response;
  }

  /**
    * Sets text response
    *
    * @param {string} responseText the text to be set in the response (required)
    * @param {('APPEND'|'REPLACE')} [mergeBehaviour] Decides response queue behaviour
    */
  setResponseText (responseText, mergeBehaviour = 'APPEND') {
    if (this._config.platformsEnabled.indexOf('TEXT') >= 0) {
      this._response.fulfillmentResponse.messages.push({ text: { text: [responseText] } });
      this._response.fulfillmentResponse.mergeBehaviour = mergeBehaviour;
    } else {
      throw new Error('platform - TEXT is not enabled');
    }
  }

  setInvalidParameter (parameter) {
    const pageInfo = this._request.pageInfo;
    const capturedParameters = pageInfo.formInfo.parameterInfo;
    const hasParameter = !!capturedParameters
      .filter(param => param.displayName === parameter).length;
    if (!hasParameter) {
      logger.log('error', 'Didn\'t find parameter to be set invalid');
      return;
    }

    this._response.pageInfo = pageInfo;
    this._response.pageInfo.formInfo.parameterInfo = capturedParameters.map((param) => {
      if (param.displayName === parameter) {
        param.state = 'INVALID';
      }
    });
  }

  setWebhookPayload (parameter, value) {
    this._response.payload[parameter] = value;
  }

  setResponseParameters (sessionParameters) {
    this._response.sessionInfo.parameters = sessionParameters;
  }

  setTargetPage (target) {
    const currentPage = this._request.pageInfo.currentPage;
    let targetPage = currentPage.split('/');
    targetPage.splice(-1, 1, target);
    targetPage = targetPage.join('/');
    this._response.targetPage = targetPage;
  }

  setTargetFlow (target) {
    const currentPage = this._request.pageInfo.currentPage;
    let targetFlow = currentPage.split('/');
    targetFlow.splice(-3, 3, target);
    targetFlow = targetFlow.join('/');
    this._response.targetFlow = targetFlow;
  }

  setResponseKey (type, value, key) {
    value.key = key;
    switch (type) {
      case 'error':
        this._responseType.errorKeys.push(value);
        break;
      case 'success':
        this._responseType.successKeys.push(value);
        break;
      case 'confirmation':
        this._responseType.confirmation.push(value);
        break;
      default:
        break;
    }
  }

  setParameter (parameter, value) {
    if (this._config.platformsEnabled.indexOf('TEXT') >= 0) {
      this._response.sessionInfo.parameters[parameter] = value;
    } else {
      throw new Error('platform - TEXT is not enabled');
    }
  }

  setTemplateResponse (message) {
    this._messageTemplate.push(message);
  }

  setPayload (payload) {
    this._response.fulfillmentResponse.messages.push({ payload: payload });
  }

  setIntentParamters (key, value) {
    this._request.intentInfo.parameters[key] = {};
    this._request.intentInfo.parameters[key].resolvedValue = value;
  }

  overrideResponseText (responseText, templateResponse) {
    const response = responseText.map((response) => {
      return { text: { text: [response] } };
    });
    this._messageTemplate = _.flatten([templateResponse || responseText]);
    this._response.fulfillmentResponse.messages = response;
    this._response.fulfillmentText = (responseText && responseText[0]) || '';
  }

  overrideResponse (responseText) {
    this._response.fulfillmentResponse.messages = [{ text: { text: [responseText] } }];
  }

  clearResponseQueue () {
    this._response.fulfillmentResponse.messages = [];
  }

  concatResponseText () {
    const response = [];
    const finalResponse = [];
    let finalResponseText = '';
    this._response.fulfillmentResponse.messages.forEach(resp => {
      response.push(resp.text.text[0]);
    });
    finalResponseText = response.join(' ');
    finalResponse.push({ text: { text: [finalResponseText] } });
    this._response.fulfillmentResponse.messages = finalResponse;
    this._response.fulfillmentText = finalResponseText;
  }
}

module.exports = DialogflowFulfillmentV3;
