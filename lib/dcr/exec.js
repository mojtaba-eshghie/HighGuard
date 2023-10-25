const axios = require('axios');
let getBasicAuth = require('./utils/auth.js');

let dcrCaller = (contractQueue, dcrID, simID, monitorResultsQueue) => {

  getBasicAuth().then(basicAuth => {
    let req_instance = axios.create({
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
      req_instance.post(nextEventAddress, requestBody)
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

module.exports = dcrCaller

