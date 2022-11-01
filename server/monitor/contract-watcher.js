let WaitQueue = require('wait-queue');
//let { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const Web3 = require("web3");
let fs = require('fs');

ETHEREUM_NETWORK = "goerli"
INFURA_API_KEY = "wss://goerli.infura.io/ws/v3/c05b5a2a17704036b3f7f34eb166eddd"
SIGNER_PRIVATE_KEY = "507fa0895604a7826a816b4100da7d5c05a1d53b18c26a1db5eebac3357a4b05"


let connect = () => {
  

  const Web3 = require("web3");

  // Configuring the connection to an Ethereum node
  const network = ETHEREUM_NETWORK;
  const web3 = new Web3(
    new Web3.providers.WebsocketProvider(
      INFURA_API_KEY
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
  let contract_interface = JSON.parse(fs.readFileSync('./contracts/json-interface/' + contract_name + '.json'));
  return contract_interface;
}


/**
 * Listens to all blockchain events on a particular smart contract
 */
let listen = (address) => {
  
  let queue = new WaitQueue();
  
  web3 = connect();
  json_interface = get_contract_abi('sample');
  let contract = new web3.eth.Contract(json_interface, address);

  contract.events.allEvents({}, (error, event) => {
    queue.push(event);
  })
  

  return queue;
}



module.exports = listen;