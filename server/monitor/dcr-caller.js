const axios = require('axios');


let req_instance = axios.create({
  headers: {
    Authorization: 'Basic ZXNoZ2hpZUBrdGguc2U6RXNoZ2hhbVhvZGFzdFRhMTAwMFNhbA=='
  }
})

async function execute_event(dcr_id, sim_id, event_name) {    
  let exec_event_address = `https://repository.dcrgraphs.net/api/graphs/${dcr_id}/sims/${sim_id}/events/${event_name}`
  console.log(exec_event_address);

  req_instance.post(exec_event_address)
    .then(response => {
      //console.log(response.data);
      console.log('event executed.');
    })
    .catch(error => {
      if (error.response.status == 400) {
        // BAD REQUEST returned from the server; the event is not executable.
        console.log('event not executable;');
      } 
    });
}


/**
 * Serves the newly arrived event in the queue
 */
let serve = (event, dcr_id, sim_id) => {
  let event_name = event.event;
  execute_event(dcr_id, sim_id, event_name);
}

/**
 * Listens on the queue parameter passed from the monitor to listen on it
 */
let listen = (queue, dcr_id, sim_id) => {
  console.log(queue);

  queue.shift().then( (event) => {
    serve(event, dcr_id, sim_id);
    setImmediate(listen);
  });
}


let dcr_caller = (queue, dcr_id, sim_id) => {
  // listen to the queue
  listen(queue, dcr_id, sim_id);
}


module.exports = dcr_caller

