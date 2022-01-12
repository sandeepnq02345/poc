const config = require('../config');
const { statisticsMapper } = config();
const template = require('lodash.template');

/**
* It replaces the static strings.
* @param {String} responseTemplate - template of the response to be changes.
* @param {String} values - value to be replaces in template.
* @return {String} - restoredTemplate
*/
const resolveStaticParameters = (responseTemplate, values) => {
  const dynamicValues = Object.values(statisticsMapper).join('|');
  const preventDynamicInterpolationRegex = new RegExp(`<%=( |)(${dynamicValues})( |)%>`, 'g');
  const updatedResponse = responseTemplate.replace(preventDynamicInterpolationRegex, (key) => {
    key = key.replace(/<|>|%| |=/g, '');
    return `<==${key}=>`;
  });
  const compileTemplate = template(updatedResponse);
  const resolvedTemplate = compileTemplate(values);
  const restoreDynamicInterpolation = new RegExp(`<==(${dynamicValues})=>`, 'g');
  const restoredTemplate = resolvedTemplate.replace(restoreDynamicInterpolation, (key) => {
    key = key.replace(/<|>|%| |=/g, '');
    return `<%= ${key} %>`;
  });
  return restoredTemplate;
};

module.exports = { resolveStaticParameters };
