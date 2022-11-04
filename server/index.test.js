let monitor = require('./monitor/index');

let monitor_results_queue = monitor('0x76845822857079df6447767AAcC7753D62E0d245', 1327657, 1472502, 'sample');


let run = () => {
    monitor_results_queue.shift().then( (event) => {
        console.log(event);
        setImmediate(run);
    });
  }
run();
