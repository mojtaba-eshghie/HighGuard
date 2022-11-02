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


execute_event(1327657, 1472452, 'two_a')

// All simulations of a contract:
//https://repository.dcrgraphs.net/api/graphs/id/sims
//fetch_api('https://repository.dcrgraphs.net/api/graphs/1327657/sims')

// particular simulation:
//fetch_api('https://repository.dcrgraphs.net/api/graphs/1327657/sims/1472419/')

// events:
// https://repository.dcrgraphs.net/api/graphs/id/sims/simid/events
//fetch_api('https://repository.dcrgraphs.net/api/graphs/1327657/sims/1472419/events')

// relations:
//https://repository.dcrgraphs.net/api/graphs/id/sims/simid/relations
//fetch_api('https://repository.dcrgraphs.net/api/graphs/1327657/sims/1472419/relations')


// 