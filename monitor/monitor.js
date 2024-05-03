require('module-alias/register');
const EventEmitter = require('events');
const ContractWatcher = require('@lib/monitor/watchpost');
const DCRTranslator = require('@lib/monitor/translate');
const DCRExecutor = require('@lib/dcr/exec');
const logger = require('@lib/logging/logger');
const fs = require('fs');
const path = require('path');
let { getLastSimulationId } = require('@lib/dcr/info');


class Monitor extends EventEmitter {
  constructor(configs) {
    super();
    this.executedActivities = [];
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
    
    // Decide if we need the middleware for handling response relation semantics or not
    this.hasResponse = this.configs.hasResponseRelation;
    if (this.hasResponse) {
      this.responseTable = 
    } 
    
    // The trace the monitor is watching can either be violating or not;
    this.violating = false;

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
      const promises = dcrActivities.map(activity => {
        if (this.hasResponse) {
          // put the 
        } else {
          this.executeDCRActivity(activity);
        }
      });
      await Promise.all(promises); // Waits for all activities to finish executing
      this.writeMarkdownFile();
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
      this.executedActivities.push(result);
      this.violating = result.violation ? result.violation : this.violating;
      logger.debug(`The executed dcr activities are: ${JSON.stringify(this.executedActivities)}`);
    } catch (error) {
      logger.error('Error executing DCR Activity:', error);
    }
  }

  handleError(error) {
    // Handle any errors that occur within the contract watcher
    console.error('Error in ContractWatcher:', error);
  }

  
  writeMarkdownFile() {
    const headers = ['Activity ID', 'Time', 'Violation'];
    const rows = this.executedActivities.map(activity => [
        activity.name || '',
        activity.time || '',
        String(activity.violation) || ''
    ]);

    // Construct markdown content from the headers and rows
    const headerLine = `| ${headers.join(' | ')} |`;
    const separatorLine = `| ${headers.map(() => '---').join(' | ')} |`;
    const tableRows = rows.map(row => `| ${row.join(' | ')} |`).join('\n');

    const markdownContent = `${headerLine}\n${separatorLine}\n${tableRows}`;

    const fileName = `${this.configs.contractFileName}.md`;
    const filePath = path.join('results', fileName);

    fs.writeFileSync(filePath, markdownContent, 'utf8');
    logger.info(`Markdown file written: ${filePath}`);
  }

}

module.exports = Monitor;