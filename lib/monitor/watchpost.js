const EventEmitter = require('events');
const { getContractABI } = require('@lib/web3/deploy');
//const logger = require('@lib/logging/logger');
const getLogger = require('@lib/logging/logger').getLogger;
const watchpostLogger = getLogger('watchpost');

class ContractWatcher extends EventEmitter {
  constructor(web3, contractAddress, contractIdentifier, contractABI) {
    super();
    this.web3 = web3;
    this.contractAddress = contractAddress.toLowerCase();
    this.contractABI = contractABI;
    // Ensure that paramaps is defined or passed as a parameter if required
    // this.paramaps = paramaps; // Uncomment and define paramaps if necessary
  }

  startWatching() {
    this.web3.eth.subscribe('newBlockHeaders', async (error, header) => {
      if (error) {
        this.emit('error', error);
        return;
      }

      try {
        const block = await this.web3.eth.getBlock(header.number, true);
        block.transactions.forEach((tx) => {
          if (tx.to && tx.to.toLowerCase() === this.contractAddress) {
            this.emit('newTransaction', tx);
            watchpostLogger.debug(`We received a new transaction: ${JSON.stringify(tx)}`);
          }
        });
      } catch (error) {
        this.emit('error', error);
      }
    });
  }
}

module.exports = ContractWatcher;