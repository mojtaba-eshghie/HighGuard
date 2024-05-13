require('module-alias/register');
const axios = require('axios');
const unsafeAuth = require('@lib/auth/unsafe-authenticate');
//const logger = require('@lib/logging/logger');
const getLogger = require('@lib/logging/logger').getLogger;
const execLogger = getLogger('exec');
const chalk = require('chalk');
const { createAuthInstance } = require('@lib/auth/middleware');


class DCRExecutor {
  constructor() {
  }

  async makeSimulation(dcrId) {
    try {
      const basicAuth = await unsafeAuth();
      const reqInstance = axios.create({
        headers: {
          Authorization: basicAuth
        }
      });
      const createSimulationAddress = `https://repository.dcrgraphs.net/api/graphs/${dcrId}/sims`;
      const response = await reqInstance.post(createSimulationAddress);
      execLogger.debug(`Response: ${response}`);

      return response; 

    } catch (error) {
      execLogger.error(chalk.red(error));
      throw error; // Rethrow the error to be handled by the caller
    }
  }
  
  async executeActivity(dcrId, simId, activityId, activityValue = null, activityType = null, dcrRole = null) {
    const reqInstance = await createAuthInstance();
    const nextEventAddress = `https://repository.dcrgraphs.net/api/graphs/${dcrId}/sims/${simId}/events/${activityId}`;
    let requestBody = {};
    
    // Construct the request body based on the provided parameters
    if (activityValue && activityType) {
      requestBody.DataXML = `<globalStore><variable value="${activityValue}" isNull="false" type="${activityType}" /></globalStore>`;
    }
    // Additional logic can be added here to handle the dcrRole if necessary
  
    try {
      execLogger.debug('Trying to execute the following DCR activity');
      execLogger.debug(`requestBody: ${JSON.stringify(requestBody, null, 2)}`);
      execLogger.debug(`nextEventAddress: ${nextEventAddress}`);
      let res = await reqInstance.post(nextEventAddress, requestBody);
      return { name: activityId, time: new Date().toGMTString(), violation: false };
    } catch (error) {
      if (error.response && error.response.status === 400) {
        // Handle the violation
        return { name: activityId, time: new Date().toGMTString(), violation: true };
      }
      throw error; // Rethrow the error to be handled by the caller
    }
  }

  

  
}

module.exports = DCRExecutor;
