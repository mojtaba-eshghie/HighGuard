let WaitQueue = require('wait-queue');
let Web3 = require("web3");
let fs = require('fs');
let path = require('path');
let { getDCRFromTX } = require('./evm-to-dcr');

ETHEREUM_NETWORK = "sepolia"
INFURA_API_KEY = "wss://sepolia.infura.io/ws/v3/c05b5a2a17704036b3f7f34eb166eddd"
SIGNER_PRIVATE_KEY = "507fa0895604a7826a816b4100da7d5c05a1d53b18c26a1db5eebac3357a4b05"


let connect = () => {
  const Web3 = require("web3");

  // Configuring the connection to an Ethereum node
  const network = ETHEREUM_NETWORK;

  const web3 = new Web3(
    new Web3.providers.WebsocketProvider(
      INFURA_API_KEY,
      {
        clientConfig:{
        maxReceivedFrameSize: 10000000000,
        maxReceivedMessageSize: 10000000000,
        } 
      }
    )
  );

  // Creating a signing account from a private key
  const signer = web3.eth.accounts.privateKeyToAccount(
    SIGNER_PRIVATE_KEY
  );

  web3.eth.accounts.wallet.add(signer);

  return web3;
}

let get_contract_abi = (contract_name) => {  
  //let contract_interface = JSON.parse(fs.readFileSync('./../contracts/json-interface/' + contract_name + '.json'));
  let contract_interface = JSON.parse(fs.readFileSync(path.join(__dirname,'/contracts/json-interface/') + contract_name + '.json'));

  return contract_interface; 
}


/**
* Listens to all blockchain events on a particular smart contract
*/
let listen = (address, contractABI) => {
  
  let contract_queue = new WaitQueue();
  
  web3 = connect();
  json_interface = JSON.parse(contractABI);
  console.log(json_interface);
  
  let contract = new web3.eth.Contract(json_interface, address);

  contract.events.allEvents({}, (error, event) => {
    console.log('We received an event: ' + event);
    event.contractABI = contractABI;
    contract_queue.push(event);
  })
  

  return contract_queue;
}



let getContractTransactions = (address, contractABI, activities, paramaps) => {
  let contract_queue = new WaitQueue();

  let web3 = connect();
  web3.eth.subscribe('newBlockHeaders', (error, header) => {
    if (error) {
      console.error(error);
      return;
    }

    // Get the block object for the current header
    web3.eth.getBlock(header.number, true, (error, block) => {
      if (error) {
        console.error(error);
        return;
      }

      // Iterate over all transactions in the block
      block.transactions.forEach((tx) => {
        // Check if the transaction involves the specified contract address
        if (tx.to && tx.to.toLowerCase() === address.toLowerCase()) {
          let dcrEvents = getDCREvents(tx);
          if (dcrEvents) {
            contract_queue.push(dcrEvents);
          }
        }
      });

    });
  });

  return contract_queue;
}



module.exports = getContractTransactions;