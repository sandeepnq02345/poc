'use strict';

/**
* It validates the remove action.
* @param {Object} df - df object from the dialogflow.
* @param {String} type - type of the action.
* @return {Boolean}
*/
const validateRemoveAction = (df, type) => {
  const { userCurrentState } = df.getCurrentSessionParameters();
  if (!userCurrentState[type]) {
    df.setParameter('user_actions', null);
    df.setParameter('filters', null);
    return false;
  }
  return true;
};

module.exports = { validateRemoveAction };
