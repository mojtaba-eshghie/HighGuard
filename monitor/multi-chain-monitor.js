require('module-alias/register');
const EventEmitter = require('events');
const ContractWatcher = require('@lib/monitor/watchpost');
const DCRTranslator = require('@lib/monitor/translate');
const DCRExecutor = require('@lib/dcr/exec');
const getLogger = require('@lib/logging/logger').getLogger;
const monitorLogger = getLogger('monitor');

const fs = require('fs');
const path = require('path');
let { getLastSimulationId, getPendingActivities } = require('@lib/dcr/info');
const { json } = require('express');
const { default: chalk } = require('chalk');


class Monitor extends EventEmitter {
  constructor(configs) {
    super();
    this.executedActivities = [];
    this.configs = configs;
    
    this._status = 'IDLE';
    this.setStatus('IDLE');


    // Initialize the contract watcher, translator, and executor for this instance

    // The following is just here as an example correct format of how configs should be passed to monitor
    // let configs = {
    //     "A": {
    //         web3: envAnvil.web3,
    //         contractAddress: contractsA.router._address,
    //         contractFileName: 'EthRouter',
    //         contractName: 'EthRouter',
    //         contractABI: contractABIA,
    //         modelFunctionParams: null,
    //     },
    //     "B": {
    //         web3: envAnvil.web3,
    //         contractAddress: contractsA.router._address,
    //         contractFileName: 'EthRouter',
    //         contractName: 'EthRouter',
    //         contractABI: contractABIA,
    //         modelFunctionParams: null,
    //     },
    //     activities: await getActivities(1823056),
    //     modelId: 1823056,
    //     hasResponseRelation: true,
    // };

    // 2 watchers
    this.contractWatcherA = new ContractWatcher(
        this.configs.A.web3,
        this.configs.A.contractAddress,
        this.configs.A.contractName, 
        this.configs.A.contractABI
    );
    this.contractWatcherB = new ContractWatcher(
        this.configs.B.web3,
        this.configs.B.contractAddress,
        this.configs.B.contractName, 
        this.configs.B.contractABI
    );
      
    // 2 translators
    this.dcrTranslatorA = new DCRTranslator(
        this.configs.A.contractABI,
        this.configs.A.modelFunctionParams,
        this.configs.A.web3
    );
    this.dcrTranslatorB = new DCRTranslator(
        this.configs.B.contractABI,
        this.configs.B.modelFunctionParams,
        this.configs.B.web3
    );

    // executor
    this.dcrExecutor = new DCRExecutor();
    
    // Decide if we need the middleware for handling response relation semantics or not
    this.hasResponse = this.configs.hasResponseRelation;
     
    
    // The trace the monitor is watching can either be violating or not;
    this.violating = false;

    // Setting up a new simulation for the model
    this.simulate().catch(err => {
      monitorLogger.error(`Initialization failed: ${err}`);
      this.status = 'ERROR'; 
    });
    
  }

  async simulate() {
    await this.dcrExecutor.makeSimulation(this.configs.modelId);
    let simId = await getLastSimulationId(this.configs.modelId);
    this.simId = simId;
    this.setStatus('INITIALIZED');     
    monitorLogger.debug(`The simulation id for the monitor: ${this.simId}`);
  } catch (error) {
    this.setStatus('ERROR');
    monitorLogger.error(`Simulation setup failed: ${error}`);
  }

  setStatus(newStatus) {
    if (this._status !== newStatus) {
      this._status = newStatus;
      this.emit('statusChange', this._status);  
    }
  }

  start() {
    const handleEventFromA = (tx) => this.handleContractEvent(tx, 'A');
    const handleEventFromB = (tx) => this.handleContractEvent(tx, 'B');

    // Bind the event handlers to this instance to ensure they have the correct `this` context
    this.contractWatcherA.on('newTransaction', handleEventFromA);
    this.contractWatcherA.on('error', this.handleError.bind(this));

    // Start watching for contract events
    this.contractWatcherA.startWatching();

    this.contractWatcherB.on('newTransaction', handleEventFromB);
    this.contractWatcherB.on('error', this.handleError.bind(this));

    // Start watching for contract events
    this.contractWatcherB.startWatching();

    this.setStatus('RUNNING');
  }

  async handleContractEvent(tx, source) {
    let violates = false;
    // Process the transaction and translate it into DCR activities
    console.log(chalk.cyan(`config activities are: ${this.configs.activities}`));
    let dcrActivities; 
    if (source == 'A') {
        dcrActivities = this.dcrTranslatorA.getDCRFromTX(tx, this.configs.activities);
    } else if (source == 'B') {
        dcrActivities = this.dcrTranslatorB.getDCRFromTX(tx, this.configs.activities);
    } else {
        throw new Error("The source in multi-chain monitor is not recognizable");
    }
    
    monitorLogger.info(`dcrActivities: ${dcrActivities}`);
    if (dcrActivities) {
      const promises = dcrActivities.map(async activity => {
        if (this.hasResponse) {
          let pendingActivities = await getPendingActivities(this.configs.modelId, this.simId);
          let pendingActivity = pendingActivities.find(a => a.id === activity["activityId"]);
          if (pendingActivity){
            let deadline = pendingActivity.deadline;
            if (deadline) {
              // This is where we can use this deadlined pending relation;
              deadline = new Date(deadline);
              const now = new Date();
              //const futureTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Add 24 hours in milliseconds
              if (now > deadline) {
                violates = true;
              } else {
                
              }            
            }
          }
        }

        await this.executeDCRActivity(activity, violates);
      });
      await Promise.all(promises); // Waits for all activities to finish executing
      this.writeMarkdownFile();
    }
  }
  

  async executeDCRActivity(dcrActivity, violates) {
    // Execute the DCR activity
    // Here you would need the simulation ID and other details to execute the activity
    // Assuming you have a method to get or create a simulation ID
    try {
      const result = await this.dcrExecutor.executeActivity(
        this.configs.modelId,
        this.simId,
        dcrActivity.activityId,
        dcrActivity.dcrValue,
        dcrActivity.dcrType
      );
      //monitorLogger.debug(`Activity execution result: ${result}`);
      this.executedActivities.push(result);
      //result.violation = violates;
      result.violation = violates ? violates : result.violation;
      this.violating = result.violation ? result.violation : this.violating;
      monitorLogger.debug(`This time, violates is: ${violates}`);
      monitorLogger.debug(`The executed dcr activities are: ${JSON.stringify(this.executedActivities)}`);
    } catch (error) {
      monitorLogger.error('Error executing DCR Activity:', error);
    }
  }

  handleError(error) {
    // Handle any errors that occur within the contract watcher
    console.error('Error in ContractWatcher:', error);
  }

  
  writeMarkdownFile() {
    const headers = ['Activity ID', 'Time', 'Violation', 'Simulation'];
    const rows = this.executedActivities.map(activity => [
        activity.name || '',
        activity.time || '',
        String(activity.violation) || '',
        this.simId || ''
    ]);

    // Construct markdown content from the headers and rows
    const headerLine = `| ${headers.join(' | ')} |`;
    const separatorLine = `| ${headers.map(() => '---').join(' | ')} |`;
    const tableRows = rows.map(row => `| ${row.join(' | ')} |`).join('\n');

    const markdownContent = `${headerLine}\n${separatorLine}\n${tableRows}`;

    const fileName = `${this.configs.contractFileName}.md`;
    const filePath = path.join('results', fileName);

    fs.writeFileSync(filePath, markdownContent, 'utf8');
    monitorLogger.debug(`Markdown file written: ${filePath}`);
  }

}

module.exports = Monitor;