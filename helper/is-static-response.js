'use strict';

/**
* Checks if given response is static.
* @param {Array} responseTemplate - template of the response.
* @return {Boolean}
*/
const isStaticResponse = (responseTemplate) => {
  for (let i = 0; i < responseTemplate.length; i++) {
    if (responseTemplate[i].includes('<%=')) {
      return false;
    }
  };
  return true;
};

module.exports = { isStaticResponse };
