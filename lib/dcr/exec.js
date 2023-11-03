require('module-alias/register');
const axios = require('axios');
const unsafeAuth = require('@lib/auth/unsafe-authenticate');
const logger = require('@lib/logging/logger');
const chalk = require('chalk');
const { createAuthInstance } = require('@lib/auth/middleware');
 

let dcrCaller = (contractQueue, dcrID, simID, dcrResultsQueue) => {
  getBasicAuth().then(basicAuth => {
    let reqInstance = axios.create({
      headers: {
        Authorization: basicAuth
      }
    })

    async function executeEvent(dcrID, simID, eventName, dcrValue, dcrType, dcrResultsQueue) {    
      let nextEventAddress = `https://repository.dcrgraphs.net/api/graphs/${dcrID}/sims/${simID}/events/${eventName}`
      let requestBody = {};
      if (dcrValue) {
        requestBody = {
          DataXML: `<globalStore><variable value="${dcrValue}" isNull="false" type="${dcrType}" /></globalStore>`
        };  
      }

      //console.log(nextEventAddress)
      reqInstance.post(nextEventAddress, requestBody)
        .then(response => {
          let resultingEventObject = {
            'name': eventName,
            'time': new Date().toGMTString(),
            'violation': false 
          }
          //dcrResultsQueue.push(`Event "${eventName}", came ${new Date().toGMTString()} executed successfully!`);
          dcrResultsQueue.push(resultingEventObject);
          // I would say the (dcrID, simID, eventName, time, success) tupple should be put in a shared queue (producer/consumer)
          // between dcrCaller and main server application
        })
        .catch(error => {
          if (error.response.status == 400) {
            console.log(error)
            //console.log(error.response);
            let resultingEventObject = {
              'name': eventName,
              'time': new Date().toGMTString(),
              'violation': true 
            }
            // BAD REQUEST returned from the server; the event is not executable.
            //dcrResultsQueue.push(`Violation: "${eventName}", came ${new Date().toGMTString()} is a violation!`);
            dcrResultsQueue.push(resultingEventObject);
          } 
        });
    }


    /**
     * Serves the newly arrived event in the queue
     */
    let serve = async (event, dcrID, simID, dcrResultsQueue) => {
      let eventName = event.dcrID;
      let dcrValue = event.dcrValue;
      let dcrType = event.dcrType;
      
      executeEvent(dcrID, simID, eventName, dcrValue, dcrType, dcrResultsQueue).then((result) => {
      })
    }

    /**
     * Listens on the queue parameter passed from the monitor to listen on it
     */
    let listen = (contractQueue, dcrID, simID, monitor_results_queue_) => {
      let dcrResultsQueue = monitor_results_queue_;


      let run = () => {
        contractQueue.shift().then( (event) => {
          serve(event, dcrID, simID, dcrResultsQueue);
          setImmediate(run); 
        });
      }
      run();
    }

    listen(contractQueue=contractQueue, dcrID=dcrID, simID=simID, dcrResultsQueue=dcrResultsQueue);
    
  });

}

let makeSimulation = async (dcrId) => {
  try {
    const basicAuth = await unsafeAuth();
    
    let reqInstance = axios.create({
      headers: {
        Authorization: basicAuth
      }
    });

    let createSimulationAddress = `https://repository.dcrgraphs.net/api/graphs/${dcrId}/sims`;

    try {
      const response = await reqInstance.post(createSimulationAddress);
    } catch (error) {
      logger.error(chalk.orange(error));
      if (error.response && error.response.status === 400) {
        throw new Error('Failed to create simulation: ' + error.message);
      } else {
        throw new Error('An unexpected error occurred: ' + error.message);
      }
    }
  } catch (error) {
    console.error(error);  // Log the error
    throw error;  
  }
};

// Executes an activity with neither the role nor the value of the activity 
// The role logic will be added later
let executeSimpleActivity = (dcrId, simId, activityId, dcrRole=undefined) => {
  createAuthInstance().then(reqInstance => {
    async function executeEvent(dcrId, simId, activityId, dcrResultsQueue) {    
      let nextEventAddress = `https://repository.dcrgraphs.net/api/graphs/${dcrID}/sims/${simID}/events/${eventName}`
      let requestBody = {};

      reqInstance.post(nextEventAddress, requestBody)
        .then(response => {
          let resultingEventObject = {
            'name': eventName,
            'time': new Date().toGMTString(),
            'violation': false 
          }
        })
        .catch(error => {
          if (error.response.status == 400) {
            console.log(error)
            //console.log(error.response);
            let resultingEventObject = {
              'name': eventName,
              'time': new Date().toGMTString(),
              'violation': true 
            }
            // BAD REQUEST returned from the server; the event is not executable.
            //dcrResultsQueue.push(resultingEventObject);
          } 
        });
    }
  });
}

// The dcrRole logic will be added later
let executeActivity = (dcrId, simId, activityId, activityValue, activityType, dcrRole=undefined) => {
  createAuthInstance().then(reqInstance => {

    async function executeEvent(dcrId, simId, activityId, dcrValue, dcrType, dcrRole=undefined, dcrResultsQueue) {    
      let nextEventAddress = `https://repository.dcrgraphs.net/api/graphs/${dcrId}/sims/${simId}/events/${activityId}`
      let requestBody = {};
      if (dcrValue) {
        requestBody = {
          DataXML: `<globalStore><variable value="${dcrValue}" isNull="false" type="${dcrType}" /></globalStore>`
        };  
      }

      reqInstance.post(nextEventAddress, requestBody)
        .then(response => {
          let resultingEventObject = {
            'name': eventName,
            'time': new Date().toGMTString(),
            'violation': false 
          }
        })
        .catch(error => {
          if (error.response.status == 400) {
            let resultingEventObject = {
              'name': eventName,
              'time': new Date().toGMTString(),
              'violation': true 
            }
            dcrResultsQueue.push(resultingEventObject);
          } 
        });
    }


    /**
     * Serves the newly arrived event in the queue
     */
    /*
    let serve = async (event, dcrID, simID, dcrResultsQueue) => {
      let eventName = event.dcrID;
      let dcrValue = event.dcrValue;
      let dcrType = event.dcrType;
      
      executeEvent(dcrID, simID, eventName, dcrValue, dcrType, dcrResultsQueue).then((result) => {
      })
    }
    */

    /**
     * Listens on the queue parameter passed from the monitor to listen on it
     */
    /*
    let listen = (contractQueue, dcrID, simID, monitor_results_queue_) => {
      let dcrResultsQueue = monitor_results_queue_;


      let run = () => {
        contractQueue.shift().then( (event) => {
          serve(event, dcrID, simID, dcrResultsQueue);
          setImmediate(run); 
        });
      }
      run();
    }

    listen(contractQueue=contractQueue, dcrID=dcrID, simID=simID, dcrResultsQueue=dcrResultsQueue);
    */
  });
}



module.exports = {
  dcrCaller,
  makeSimulation
}

