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
    .option('paramap', {
        type: 'boolean',
        default: false,
        describe: 'Supply parameter mapping for function calls to DCR graphs semantics for any transaction. The same file name as ABIFileName will be looked up in server/monitor/contracts/paramaps/ directory. Format of the required json file: \n' +
                  '{ \n' +
                  '   "functionName": { \n' +
                  '       "paramName": { \n' +
                  '              EVMType: "...", \n' +
                  '              DCRType: "...", \n' +
                  '              DCRNodeID: "..." \n' +
                  '       } \n' +
                  '   } \n' +
                  '}',
    })
    .argv;

try {   
    let contractABI = fs.readFileSync(`./contracts/json-interface/${argv.ABIFileName}`, 'utf8');
    let paramaps = JSON.parse(fs.readFileSync(`./contracts/paramaps/${argv.ABIFileName}`, 'utf8'));

    let monitorConfigs = {
        'contract': argv.contract,
        'address': argv.address,
        'dcrID': argv.dcrID,
        'simID': argv.simID
    }

    setupMonitorSession(monitorConfigs).then((monitorInfo) => {
        // Let contract_watcher to watch the contract
        // Returns a queue of events emitted from the contract; this queue is shared between subsystems of the monitor
        let contractQueue = contractWatcher(argv.address, contractABI, monitorInfo["activities"], paramaps);

        
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
  
