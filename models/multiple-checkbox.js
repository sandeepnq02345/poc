const StateParamsHandler = require('./state-params-handler');

/**
 * Class to implement group of checkboxes
 * example: Involuntary Liens
 */
class MultiCheckBox extends StateParamsHandler {
  // to inherit

  /**
   * MultiCHeckBox constructor
   * @param  {Object} df dialogflow object
   * @param  {Object} capturedParameters JSON object of DFCX captured parameters
   */
  constructor (df, capturedParameters) {
    super(df);
    const { action, filterName, filterSchema, isLayerAction } = capturedParameters;
    this.filterName = filterName;
    this.filterSchema = filterSchema;
    this.isLayerAction = isLayerAction;
    this.action = action;
    this.setConfiguration();
    this.types = this.config.nestedLayers;

    this.process();
    this.setStateParams();
  }

  /**
  * Processing Function to set all the Layer status
  */
  process () {
    this.setMultipleLayerStatus(this.performAction(this.action));
  }

  /**
   * Choose between setting status true or false
   * @param  {string} remove
   */
  performAction (remove) {
    if (!remove) { return this.turnOn(); }
    return this.turnOff();
  }

  /**
   * Set status to true
   */
  turnOn () {
    const result = {};
    this.types.forEach(type => {
      result[type] = { status: true };
    });
    return result;
  };

  /**
   * Set status to false
   */
  turnOff () {
    const result = {};
    this.types.forEach(type => {
      result[type] = { status: false };
    });
    return result;
  }
}

module.exports = { MultiCheckBox };
