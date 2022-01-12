'use strict';

/**
 *
 * @param {DialogflowFulfillmentV3} df
 * @param {String} userId
 * @param {*} responseTemplate
 * @param {boolean} isStatic
 */
const addAgentStubbedResponse = (df, responseTemplate, requiredDynamicValues, isStatic) => {
  try {
    df.setParameter('requiredDynamicValues', requiredDynamicValues);
    df.setParameter('responseTemplate', responseTemplate);
    // df.setParameter('isStaticResponse', isStatic);
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = { addAgentStubbedResponse };
