
/**
 * Serves the newly arrived event in the queue
 */
let serve = (event, dcrgraph_id) => {
  let event_name = event.event;

}

/**
 * Listens on the queue parameter passed from the monitor to listen on it
 */
let listen = (queue) => {
  queue.shift().then( (event) => {
    serve(event, dcrgraph_id);
    setImmediate(listen);
  });
}


let dcr_caller = (queue, dcrgraph_id) => {
  

  // 

  // listen to the queue
  listen(queue);
}



module.exports = dcr_caller

