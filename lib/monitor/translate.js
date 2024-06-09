const { default: chalk } = require("chalk");
const Web3 = require("web3");
//const logger = require('@lib/logging/logger');
const getLogger = require('@lib/logging/logger').getLogger;
const transLogger = getLogger('translate');

class DCRTranslator {
  constructor(contractABI, modelFunctionParams, web3) {
    this.contractABI = contractABI;
    this.modelFunctionParams = modelFunctionParams;
    this.web3 = web3;
  }

  getDCRFromTX(tx, activities) {
    const signature = tx.input.slice(0, 10);
    const method = this.contractABI.find((m) => m.type === 'function' && `0x${this.web3.utils.keccak256(m.name + '(' + m.inputs.map((i) => i.type).join(',') + ')').slice(2, 10)}` === signature);
    transLogger.info(`our method is: ${method}`);
    if (!method) return null;

    transLogger.debug(`Translating and finding this method: ${method.name}`);
    
    const decodedParams = this.web3.eth.abi.decodeParameters(method.inputs, tx.input.slice(10));
    let dcrEvents = [];

    if (decodedParams.__length__ > 0) {
      for (const [key, value] of Object.entries(decodedParams)) {
        console.log(chalk.cyan(`key: ${key}, value: ${value}`));
        console.log(chalk.green(`this.modelFunctionParams: ${this.modelFunctionParams}`))
        if (key.match(/^\d+$/)) continue;
        if (this.modelFunctionParams) {
          const modelFunctionParam = this.modelFunctionParams[method.name] && this.modelFunctionParams[method.name][key];
          if (modelFunctionParam && modelFunctionParam.DCRType === "duration") {
            const iso8601Duration = this.convertToISO8601(value, modelFunctionParam.EVMUnit);
            dcrEvents.push({
              activityId: modelFunctionParam.DCRNodeID,
              dcrValue: iso8601Duration,
              dcrType: modelFunctionParam.DCRType
            });
          }
        }
      }
    } 

    transLogger.debug(`activities: ${JSON.stringify(activities)}\n method.name: ${method.name}`);
    
    if (activities.includes(method.name)) {
      dcrEvents.push({
        activityId: method.name,
        dcrValue: null,
        dcrType: null
      });
    }

    return dcrEvents.length > 0 ? dcrEvents : null;
  }

  convertToISO8601(value, unit) {
    switch (unit) {
      case "hours":
        return 'PT' + value + 'H';
      case "minutes":
        return 'PT' + value + 'M';
      case "seconds":
        return 'PT' + value + 'S';
      default:
        return "Invalid unit";
    }
  }
}

module.exports = DCRTranslator;
