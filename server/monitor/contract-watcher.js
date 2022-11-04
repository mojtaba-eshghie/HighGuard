let WaitQueue = require('wait-queue');
const Web3 = require("web3");
let fs = require('fs');
var path = require('path');

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
  console.log(path.join(__dirname,'/contracts/json-interface/'));
  
  //let contract_interface = JSON.parse(fs.readFileSync('./../contracts/json-interface/' + contract_name + '.json'));
  let contract_interface = JSON.parse(fs.readFileSync(path.join(__dirname,'/contracts/json-interface/') + contract_name + '.json'));

  return contract_interface; 
}


/**
 * Listens to all blockchain events on a particular smart contract
 */
let listen = (address, contract_abi_name) => {
  
  let contract_queue = new WaitQueue();
  
  web3 = connect();
  //json_interface = get_contract_abi('sample');
  json_interface = get_contract_abi(contract_abi_name);
  let contract = new web3.eth.Contract(json_interface, address);

  contract.events.allEvents({}, (error, event) => {
    contract_queue.push(event);
  })
  

  return contract_queue;
}



module.exports = listen;