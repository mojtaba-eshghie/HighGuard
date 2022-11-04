const axios = require('axios');


let req_instance = axios.create({
  headers: {
    Authorization: 'Basic ZXNoZ2hpZUBrdGguc2U6RXNoZ2hhbVhvZGFzdFRhMTAwMFNhbA=='
  }
})

async function execute_event(dcr_id, sim_id, event_name, monitor_results_queue) {    
  let exec_event_address = `https://repository.dcrgraphs.net/api/graphs/${dcr_id}/sims/${sim_id}/events/${event_name}`

  req_instance.post(exec_event_address)
    .then(response => {
      
      
      monitor_results_queue.push(`Event "${event_name}", came ${new Date().toGMTString()} executed successfully!`);
      // I would say the (dcr_id, sim_id, event_name, time, success) tupple should be put in a shared queue (producer/consumer)
      // between dcr-caller and main server application
    })
    .catch(error => {
      if (error.response.status == 400) {
        // BAD REQUEST returned from the server; the event is not executable.
        monitor_results_queue.push(`Violation: "${event_name}", came ${new Date().toGMTString()} is a violation!`);
      } 
    });
}


/**
 * Serves the newly arrived event in the queue
 */
let serve = async (event, dcr_id, sim_id, monitor_results_queue) => {
  let event_name = event.event;
  //let result = await execute_event(dcr_id, sim_id, event_name);
  execute_event(dcr_id, sim_id, event_name, monitor_results_queue).then((result) => {
    //console.log('39: inside dcr_caller then: ', result);
    //monitor_results_queue.push(result);
  })
  //monitor_results_queue.push(result);
}

/**
 * Listens on the queue parameter passed from the monitor to listen on it
 */
let listen = (contract_queue, dcr_id, sim_id, monitor_results_queue_) => {
  let monitor_results_queue = monitor_results_queue_;


  let run = () => {
    contract_queue.shift().then( (event) => {
      serve(event, dcr_id, sim_id, monitor_results_queue);
      setImmediate(run); 
    });
  }
  run();
}


let dcr_caller = (contract_queue, dcr_id, sim_id, monitor_results_queue) => {
  listen(contract_queue=contract_queue, dcr_id=dcr_id, sim_id=sim_id, monitor_results_queue=monitor_results_queue);
}


module.exports = dcr_caller

