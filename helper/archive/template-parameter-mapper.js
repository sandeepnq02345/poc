const speechSynthesisMarkup = {
  propertiesCount: {
    tag: 'say-as',
    attributes: {
      'interpret-as': 'cardinal'
    }
  },
  minPropertyValue: {
    tag: 'say-as',
    attributes: {
      'interpret-as': 'cardinal'
    }
  },
  maxPropertyValue: {
    tag: 'say-as',
    attributes: {
      'interpret-as': 'cardinal'
    }
  },
  medianPropertyValue: {
    tag: 'say-as',
    attributes: {
      'interpret-as': 'cardinal'
    }
  },
  averageRiskScore: {
    tag: 'say-as',
    attributes: {
      'interpret-as': 'cardinal'
    }
  },
  insightPropertyValue: {
    tag: 'say-as',
    attributes: {
      'interpret-as': 'cardinal'
    }
  },
  insightEquityValue: {
    tag: 'say-as',
    attributes: {
      'interpret-as': 'cardinal'
    }
  },
  insightPropertyValueTrend: {
    tag: 'say-as',
    attributes: {
      'interpret-as': 'cardinal'
    }
  },
  insightAverageRiskScore: {
    tag: 'say-as',
    attributes: {
      'interpret-as': 'cardinal'
    }
  },
  insightPropertyValuePeakYear: {
    tag: 'say-as',
    attributes: {
      'interpret-as': 'cardinal'
    }
  }
};

/**
* It maps termplate params to ssml params.
* @param {Object} params - parameters.
* @return {Object} - ssmlParams
*/
const mapTemplateParamToSsmlParam = (params) => {
  const ssmlParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (key in speechSynthesisMarkup) {
      const attributeName = Object.keys(speechSynthesisMarkup[key].attributes)[0];
      const attributeValue = Object.values(speechSynthesisMarkup[key].attributes)[0];
      ssmlParams[key] = '<' + speechSynthesisMarkup[key].tag + ' ' + attributeName + '="' + attributeValue + '">' + value + '<' + speechSynthesisMarkup[key].tag + '>';
    }
  }
  return ssmlParams;
};

module.exports = {
  mapTemplateParamToSsmlParam
};
