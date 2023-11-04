require('module-alias/register');
const EventEmitter = require('events');
const ContractWatcher = require('@lib/monitor/watchpost');
const DCRTranslator = require('@lib/monitor/translate');
const DCRExecutor = require('@lib/dcr/exec');
let { getLastSimulationId } = require('@lib/dcr/info');


class Monitor extends EventEmitter {
  constructor(configs) {
    super();
    this.configs = configs;
    // Initialize the contract watcher, translator, and executor for this instance
    this.contractWatcher = new ContractWatcher(
      this.configs.web3,
      this.configs.contractAddress,
      this.configs.contractFileName
    );
    this.dcrTranslator = new DCRTranslator(
      this.configs.contractABI,
      this.configs.modelFunctionParams,
      this.configs.web3
    );
    this.dcrExecutor = new DCRExecutor();
  }

  start() {
    // Bind the event handlers to this instance to ensure they have the correct `this` context
    this.contractWatcher.on('newTransaction', this.handleContractEvent.bind(this));
    this.contractWatcher.on('error', this.handleError.bind(this));
    // Start watching for contract events
    this.contractWatcher.startWatching();
    // ... other setup as needed ...
  }

  handleContractEvent(tx) {
    // Process the transaction and translate it into DCR activities
    const dcrActivities = this.dcrTranslator.getDCRFromTX(tx, this.configs.activities);
    console.log("The retrieved activity using the translator is: ", dcrActivities)
    if (dcrActivities) {
      dcrActivities.forEach(this.executeDCRActivity.bind(this));
    }
  }

  async executeDCRActivity(dcrActivity) {
    // Execute the DCR activity
    // Here you would need the simulation ID and other details to execute the activity
    // Assuming you have a method to get or create a simulation ID
    await this.dcrExecutor.makeSimulation(this.configs.modelId);
    let simId = await getLastSimulationId(this.configs.modelId);

    this.dcrExecutor.executeActivity(
      dcrActivity.dcrID,
      simId,
      dcrActivity.dcrID,
      dcrActivity.dcrValue,
      dcrActivity.dcrType
    )
    .then(result => {
      // Handle successful execution
      console.log('DCR Activity executed:', result);
    })
    .catch(error => {
      // Handle errors
      console.error('Error executing DCR Activity:', error);
    });
  }

  handleError(error) {
    // Handle any errors that occur within the contract watcher
    console.error('Error in ContractWatcher:', error);
  }

  // ... other methods as needed ...
}


module.exports = Monitor;
