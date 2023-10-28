require('module-alias/register');
const axios = require('axios');
const unsafeAuth = require('@lib/auth/unsafe-authenticate');
const logger = require('@lib/logging/logger');
const chalk = require('chalk');
 

let dcrCaller = (contractQueue, dcrID, simID, monitorResultsQueue) => {
  getBasicAuth().then(basicAuth => {
    let reqInstance = axios.create({
      headers: {
        Authorization: basicAuth
      }
    })

    async function executeEvent(dcrID, simID, eventName, dcrValue, dcrType, monitorResultsQueue) {    
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
          //monitorResultsQueue.push(`Event "${eventName}", came ${new Date().toGMTString()} executed successfully!`);
          monitorResultsQueue.push(resultingEventObject);
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
            //monitorResultsQueue.push(`Violation: "${eventName}", came ${new Date().toGMTString()} is a violation!`);
            monitorResultsQueue.push(resultingEventObject);
          } 
        });
    }


    /**
     * Serves the newly arrived event in the queue
     */
    let serve = async (event, dcrID, simID, monitorResultsQueue) => {
      let eventName = event.dcrID;
      let dcrValue = event.dcrValue;
      let dcrType = event.dcrType;
      
      executeEvent(dcrID, simID, eventName, dcrValue, dcrType, monitorResultsQueue).then((result) => {
      })
    }

    /**
     * Listens on the queue parameter passed from the monitor to listen on it
     */
    let listen = (contractQueue, dcrID, simID, monitor_results_queue_) => {
      let monitorResultsQueue = monitor_results_queue_;


      let run = () => {
        contractQueue.shift().then( (event) => {
          serve(event, dcrID, simID, monitorResultsQueue);
          setImmediate(run); 
        });
      }
      run();
    }

    listen(contractQueue=contractQueue, dcrID=dcrID, simID=simID, monitorResultsQueue=monitorResultsQueue);
    
  });

}

let makeSimulation = async (dcrID) => {
  try {
    const basicAuth = await unsafeAuth();
    
    let reqInstance = axios.create({
      headers: {
        Authorization: basicAuth
      }
    });

    let createSimulationAddress = `https://repository.dcrgraphs.net/api/graphs/${dcrID}/sims`;
    let requestBody = {};

    try {
      const response = await reqInstance.post(createSimulationAddress, requestBody);
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


module.exports = {
  dcrCaller,
  makeSimulation
}

