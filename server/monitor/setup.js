let WaitQueue = require('wait-queue');
let Web3 = require("web3");
let fs = require('fs');
let path = require('path');
let {getContractStorageVariableValue} = require('./utils/scutil');
let { getDCRRoles, getDCRActivities, getSimulationXML } = require('./utils/getDCRInfo');
let dbHandler = require('./utils/dbHandler.js');


/**
 * Retrieve the RBAC setup at the begining of monitoring and repeat it for every transaction;
 */
let updateRBAC = async (contract, contractAddress, dcrID) => {
    try {
        let roles = await getDCRRoles(dcrID);
        //console.log('Roles:', roles);

        if (!Array.isArray(roles)) {
            console.error('Roles is not an array');
            return null;
        }

        let promises = roles.map(async role => {
            let value = await getContractStorageVariableValue(contract, contractAddress, role);
            return [role, value];
        });
        
        let results = await Promise.all(promises);
        let roleValues = Object.fromEntries(results);

        //console.log('Role values:', roleValues);

        return roleValues;  // Returning the roleValues object
    } catch (error) {
        console.error('Error in setupRBAC:', error);
        return null;
    }
}



/**
 * Setup the mapping between activities and functions
 */
// Skipping function calls that are uknown within the model with the assumption that unkowns are low-level implementation 
// (they are part of activity that is being executed)


// Main setup activities;
let setupMonitorSession = async (monitorConfigs) => {
    try {
      // Retrieve the values for RBAC
      let roleValues = await updateRBAC(monitorConfigs['contract'], monitorConfigs['address'], monitorConfigs['dcrID']);
  
      // Retrieve all of the activities available in the DCR Model:
      let activities = await getDCRActivities(monitorConfigs['dcrID']);
  
      // Retrieve the simulation the user is going to use
      let simulationXML = await getSimulationXML(monitorConfigs['dcrID'], monitorConfigs['simID']);
      
      // Create the monitoring session in the database
      return new Promise((resolve, reject) => {
        dbHandler.createMonitoringSession(simulationXML, monitorConfigs['dcrID'], monitorConfigs['simID'], (err, sessionID) => {
          if (err) {
            console.error('An error occurred:', err);
            reject(err);
          } else {
            console.log('Monitoring session created with ID:', sessionID);
            res = {
                'monitoringSessionID': sessionID,
                'activities': activities
            }
            resolve(res);
          }
        });
      });
    } catch (error) {
      console.error('An error occurred in main function:', error);
      throw error; 
    }
  };



module.exports = {
    updateRBAC,
    setupMonitorSession,
}

