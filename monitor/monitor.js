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

    // watcher
    this.contractWatcher = new ContractWatcher(
      this.configs.web3,
      this.configs.contractAddress,
      this.configs.contractName, 
      this.configs.contractABI
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
    // Bind the event handlers to this instance to ensure they have the correct `this` context
    this.contractWatcher.on('newTransaction', this.handleContractEvent.bind(this));
    this.contractWatcher.on('error', this.handleError.bind(this));
    // Start watching for contract events
    this.contractWatcher.startWatching();
    
    this.setStatus('RUNNING');  
    // TODO: other setup steps
  }

  async handleContractEvent(tx) {
    let violates = false;
    // Process the transaction and translate it into DCR activities
    console.log(chalk.cyan(`config activities are: ${this.configs.activities}`))
    const dcrActivities = this.dcrTranslator.getDCRFromTX(tx, this.configs.activities);
    monitorLogger.info(`dcrActivities: ${dcrActivities}`);
    monitorLogger.info(`LINE 94 monitor`)
    if (dcrActivities) {
      monitorLogger.info(`LINE 96 monitor`)
      const promises = dcrActivities.map(async activity => {
        monitorLogger.info(`LINE 97 monitor`)
        if (this.hasResponse) {
          let pendingActivities = await getPendingActivities(this.configs.modelId, this.simId);
          let pendingActivity = pendingActivities.find(a => a.id === activity["activityId"]);
          if (pendingActivity){
            let deadline = pendingActivity.deadline;
            if (deadline) {
              monitorLogger.info(`LINE 104 monitor`)
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