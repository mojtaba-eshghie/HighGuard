require('module-alias/register');
const axios = require('axios');
const unsafeAuth = require('@lib/auth/unsafe-authenticate');
//const logger = require('@lib/logging/logger');
const getLogger = require('@lib/logging/logger').getLogger;
const execLogger = getLogger('exec');
const chalk = require('chalk');
const { createAuthInstance } = require('@lib/auth/middleware');
const { formatISO, add } = require('date-fns');



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
      execLogger.debug(`Response: ${response.toString()}`);

      return response; 

    } catch (error) {
      execLogger.error(chalk.red(error));
      throw error; // Rethrow the error to be handled by the caller
    }
  }
  
  async executeActivity(dcrId, simId, activityId, activityValue = null, activityType = null, dcrRole = null) {
    execLogger.debug(` Trying to execute ${activityId}`);
    const reqInstance = await createAuthInstance();
    const nextEventAddress = `https://repository.dcrgraphs.net/api/graphs/${dcrId}/sims/${simId}/events/${activityId}`;
    let requestBody = {};
    
    // Construct the request body based on the provided parameters
    if (activityValue && activityType) {
      requestBody.DataXML = `<globalStore><variable value="${activityValue}" isNull="false" type="${activityType}" /></globalStore>`;
    }
    execLogger.debug(` LINE 52`);
    execLogger.debug(`current requestbody.DataXML: ${requestBody.DataXML}`);
    // TODO
    // Additional logic can be added here to handle the dcrRole if necessary




    // Regardless of the contract semantics, we add the current time of the system in each and every request we send 
    //const futureTime = add(new Date(), { hours: 24 });
    // Format the future date and time in ISO 8601
    ///const futureTimeISO = formatISO(futureTime);
    let usedTime = new Date();
    usedTime = usedTime.toISOString();
    requestBody.time = `<absoluteTime>${usedTime}</absoluteTime>`;
  

    execLogger.debug(` LINE 67`);

    try {
      execLogger.debug(`nextEventAddress: ${nextEventAddress}`);
      let res = await reqInstance.post(nextEventAddress, requestBody);
      execLogger.debug(`  Response data: ${JSON.stringify(res.data)}`);
      execLogger.debug(`  Response status: ${res.status}`);
      execLogger.debug(`  Response headers: ${JSON.stringify(res.headers)}`);
      return { name: activityId, time: usedTime, violation: false };
    } catch (error) {
      // if (error.response && error.response.status === 400) {
      //   // Handle the violation
      //   return { name: activityId, time: new Date().toGMTString(), violation: true };
      // }
      execLogger.debug(`  Error response data: ${JSON.stringify(error.response.data)}`);
      execLogger.debug(`  Error response status: ${error.response.status}`);
      execLogger.debug(`  Error response headers: ${JSON.stringify(error.response.headers)}`);
      return { name: activityId, time: usedTime, violation: true };
      //throw error; 
    }
  }

  

  
}

module.exports = DCRExecutor;
