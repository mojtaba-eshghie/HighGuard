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


    // The following is just here as an example correct format of how configs should be passed to monitor
    // let configs = {
    //     "contracts": [{
    //         web3: envAnvil.web3,
    //         contractAddress: contractsA.router._address,
    //         contractFileName: 'EthRouter',
    //         contractName: 'EthRouter',
    //         contractABI: contractABIA,
    //         modelFunctionParams: null,
    //       },
    //       {
    //         web3: envAnvil.web3,
    //         contractAddress: contractsA.router._address,
    //         contractFileName: 'EthRouter',
    //         contractName: 'EthRouter',
    //         contractABI: contractABIA,
    //         modelFunctionParams: null,
    //     }],
    //     activities: await getActivities(1823056),
    //     modelId: 1823056,
    //     hasResponseRelation: true,
    // };


    // Initialize the contract watchers and translators arrays
    this.contractWatchers = [];
    this.dcrTranslators = [];

    // Loop through the contracts array in configs to create watchers and translators
    this.configs.contracts.forEach((contractConfig, index) => {
      const watcher = new ContractWatcher(
        contractConfig.web3,
        contractConfig.contractAddress,
        contractConfig.contractName,
        contractConfig.contractABI
      );
      this.contractWatchers.push(watcher);

      const translator = new DCRTranslator(
        contractConfig.contractABI,
        contractConfig.modelFunctionParams,
        contractConfig.web3
      );
      this.dcrTranslators.push(translator);
    });

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
    try {
      await this.dcrExecutor.makeSimulation(this.configs.modelId);
      let simId = await getLastSimulationId(this.configs.modelId);
      this.simId = simId;
      this.setStatus('INITIALIZED');
      monitorLogger.debug(`The simulation id for the monitor: ${this.simId}`);
    } catch (error) {
      this.setStatus('ERROR');
      monitorLogger.error(`Simulation setup failed: ${error}`);
    }
  }

  setStatus(newStatus) {
    if (this._status !== newStatus) {
      this._status = newStatus;
      this.emit('statusChange', this._status);
    }
  }

  start() {
    this.contractWatchers.forEach((watcher, index) => {
      const handleEvent = (tx) => this.handleContractEvent(tx, index);
      watcher.on('newTransaction', handleEvent);
      watcher.on('error', this.handleError.bind(this));
      watcher.startWatching();
    });

    this.setStatus('RUNNING');
  }

  async handleContractEvent(tx, index) {
    let violates = false;
    monitorLogger.debug(chalk.cyan(`config activities are: ${this.configs.activities}`));
    let dcrActivities = this.dcrTranslators[index].getDCRFromTX(tx, this.configs.activities);

    monitorLogger.debug(`dcrActivities: ${dcrActivities}`);
    if (dcrActivities) {
      const promises = dcrActivities.map(async activity => {
        if (this.hasResponse) {
          let pendingActivities = await getPendingActivities(this.configs.modelId, this.simId);
          let pendingActivity = pendingActivities.find(a => a.id === activity["activityId"]);
          if (pendingActivity) {
            let deadline = pendingActivity.deadline;
            if (deadline) {
              deadline = new Date(deadline);
              const now = new Date();
              if (now > deadline) {
                violates = true;
              }
            }
          }
        }
        await this.executeDCRActivity(activity, violates);
      });
      await Promise.all(promises);
      this.writeMarkdownFile();
    }
  }

  async executeDCRActivity(dcrActivity, violates) {
    try {
      const result = await this.dcrExecutor.executeActivity(
        this.configs.modelId,
        this.simId,
        dcrActivity.activityId,
        dcrActivity.dcrValue,
        dcrActivity.dcrType
      );
      this.executedActivities.push(result);
      result.violation = violates ? violates : result.violation;
      this.violating = result.violation ? result.violation : this.violating;
      monitorLogger.debug(`This time, violates is: ${violates}`);
      monitorLogger.debug(`The executed dcr activities are: ${JSON.stringify(this.executedActivities)}`);
    } catch (error) {
      monitorLogger.error('Error executing DCR Activity:', error);
    }
  }

  handleError(error) {
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
