/**
 * Listens on the queue parameter passed from the monitor to listen on it
 */
let caller = (queue) => {
  let listen = () => {
    queue.shift().then( (event) => {
      console.log(event);
      setImmediate(listen);
    });
  }
  listen();
}


module.exports = caller

