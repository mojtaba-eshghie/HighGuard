const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs');
let contractWatcher = require('./contractWatcher');
let dcrCaller = require('./dcrCaller');
let WaitQueue = require('wait-queue');
let { setupRBAC, setupMonitorSession} = require('./setup');
const chalk = require('chalk');


const argv = yargs(hideBin(process.argv))
    .option('address', {
        type: 'string',
        demandOption: true,
        describe: 'The address of the deployed contract',
    })
    .option('dcrID', {
        type: 'string',
        demandOption: true,
        describe: 'The DCR model identifier from DCRGraphs.net website',
    })
    .option('simID', {
        type: 'string',
        demandOption: true,
        describe: 'The identifier of the specific simulation you want to model this contract against. This identifier is retrievable by going to address https://repository.dcrgraphs.net/api/graphs/${dcrID}/sims/',
    })
    .option('ABIFileName', {
        type: 'string',
        demandOption: true,
        describe: 'The name of the contract ABI file',
    })
    .option('contract', {
        type: 'string',
        demandOption: true,
        describe: 'The contract parameter',
    })
    .argv;

try {   
    //let contractABI = JSON.parse(fs.readFileSync(`./contracts/json-interface/${argv.ABIFileName}`, 'utf8'));
    let contractABI = fs.readFileSync(`./contracts/json-interface/${argv.ABIFileName}`, 'utf8');

    //const monitorResultsQueue = monitor(argv.address, argv.dcrID, argv.simID, contract_abi, argv.contract);
       
    let monitorConfigs = {
        'contract': argv.contract,
        'address': argv.address,
        'dcrID': argv.dcrID,
        'simID': argv.simID,
    }

    //let monitorSessionID = setupMonitorSession(monitorConfigs);
    setupMonitorSession(monitorConfigs).then((monitorInfo) => {
        // Let contract_watcher to watch the contract
        // Returns a queue of events emitted from the contract; this queue is shared between subsystems of the monitor
        let contractQueue = contractWatcher(argv.address, contractABI, monitorInfo["activities"]);
        
        // Create a shared queue between dcr_caller, the top-level of the monitor, and other parts of the server-side (e.g. websocket server)
        // dcr_caller (producer) => monitor top-level (this index.js file) (consumer for dcr_caller, producer for other server parts) => websocket server (consumer)
        let monitorResultsQueue = new WaitQueue();

        // Initiate the dcrCaller...
        dcrCaller(contractQueue=contractQueue, dcrID=argv.dcrID, simID=argv.simID, monitorResultsQueue=monitorResultsQueue);
        

        (async () => {
            while (true) {
                try {
                    // Wait for a new event to be added to the queue
                    let event = await monitorResultsQueue.shift();
                    
                    // Determine the type of event and set the appropriate color
                    if (event["violation"] === false) {
                        console.log(chalk.green('New benign event:'), event);
                    } else if (event["violation"] === true) {
                        console.log(chalk.red('New violation event:'), event);
                    }
                } catch (error) {
                    console.error(chalk.red('Error reading from monitorResultsQueue:'), error);
                }
                console.log("- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -");
            }
        })();
        

    });
} catch (error) {
    console.error('An error occurred:', error);
}
  
