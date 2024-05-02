require('module-alias/register');
const EventEmitter = require('events');
const ContractWatcher = require('@lib/monitor/watchpost');
const DCRTranslator = require('@lib/monitor/translate');
const DCRExecutor = require('@lib/dcr/exec');
const logger = require('@lib/logging/logger');
const chalk = require('chalk');
let { getLastSimulationId } = require('@lib/dcr/info');


class Monitor extends EventEmitter {
  constructor(configs) {
    super();
    this.receivedActivities = [];
    this.configs = configs;
    
    this._status = 'IDLE';
    this.setStatus('IDLE');

    // Initialize the contract watcher, translator, and executor for this instance

    // watcher
    this.contractWatcher = new ContractWatcher(
      this.configs.web3,
      this.configs.contractAddress,
      this.configs.contractFileName
    );
      
    // translator
    this.dcrTranslator = new DCRTranslator(
      this.configs.contractABI,
      this.configs.modelFunctionParams,
      this.configs.web3
    );

    // executor
    this.dcrExecutor = new DCRExecutor();
    

    

    // Setting up a new simulation for the model
    this.simulate().catch(err => {
      logger.error(`Initialization failed: ${err}`);
      this.status = 'ERROR'; 
    });
    
  }

  async simulate() {
    await this.dcrExecutor.makeSimulation(this.configs.modelId);
    let simId = await getLastSimulationId(this.configs.modelId);
    this.simId = simId;
    this.setStatus('INITIALIZED');     
    logger.debug(`The simulation id for the monitor: ${simId}`);
  } catch (error) {
    this.setStatus('ERROR');
    logger.error(`Simulation setup failed: ${error}`);
  }

  setStatus(newStatus) {
    if (this._status !== newStatus) {
      this._status = newStatus;
      this.emit('statusChange', this._status);  
    }
  }

  start() {
    // Bind the event handlers to this instance to ensure they have the correct `this` context
    this.contractWatcher.on('newTransaction', this.handleContractEvent.bind(this));
    this.contractWatcher.on('error', this.handleError.bind(this));
    // Start watching for contract events
    this.contractWatcher.startWatching();
    
    this.setStatus('RUNNING');  
    // TODO: other setup steps
  }

  async handleContractEvent(tx) {
    // Process the transaction and translate it into DCR activities
    const dcrActivities = this.dcrTranslator.getDCRFromTX(tx, this.configs.activities);
    logger.debug(`The returned DCR activities are: ${JSON.stringify(dcrActivities)}`);
    if (dcrActivities) {
      const promises = dcrActivities.map(activity => this.executeDCRActivity(activity));
      await Promise.all(promises); // Waits for all activities to finish executing
    }
  }
  

  async executeDCRActivity(dcrActivity) {
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
      //logger.debug(`Activity execution result: ${result}`);
      this.receivedActivities.push(result);
      logger.debug(`The executed dcr activities are: ${JSON.stringify(this.receivedActivities)}`);
    } catch (error) {
      logger.error('Error executing DCR Activity:', error);
    }
  }

  handleError(error) {
    // Handle any errors that occur within the contract watcher
    console.error('Error in ContractWatcher:', error);
  }

  
}

module.exports = Monitor;