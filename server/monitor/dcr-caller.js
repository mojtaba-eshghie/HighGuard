/**
 * Listens on the queue parameter passed from the monitor to listen on it
 */
let caller = (queue) => {
  let listen = () => {
    queue.shift().then( (event) => {
      serve(event);
      setImmediate(listen);
    });
  }
  listen();
}

let serve = (event) => {
  console.log(event);
}


module.exports = caller

