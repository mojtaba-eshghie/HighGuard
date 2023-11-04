const EventEmitter = require('events');
const { getContractABI } = require('@lib/web3/deploy');

class ContractWatcher extends EventEmitter {
  constructor(web3, contractAddress, contractFileName) {
    super();
    this.web3 = web3;
    this.contractAddress = contractAddress.toLowerCase();
    this.contractABI = getContractABI(contractFileName);
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
          }
        });
      } catch (error) {
        this.emit('error', error);
      }
    });
  }
}

module.exports = ContractWatcher;