// Basic smart contract utilities

const Web3 = require('web3');
const web3 = new Web3('https://mainnet.infura.io/v3/your-project-id');


let getFunctionNameParams = (event, jsonInterface) => {
  let signature = txData.slice(0, 10);

  web3.eth.getTransaction(event.transactionHash, (error, transaction) => {
    if (!error) {
      console.log('Transaction data:', transaction.input);
      let txData = transaction.input;
      
      // Get the method object from the contract ABI using the method signature
      const method = JSON.parse(jsonInterface).find((m) => m.type === 'function' && `0x${web3.utils.sha3(m.name).slice(2, 10)}` === signature);

      if (method) {
        // Decode the function arguments from the transaction data
        const decodedArguments = web3.eth.abi.decodeParameters(method.inputs, txData.slice(10));

        // Log the decoded function name and parameters
        console.log(`\n\n*********************> Function name: ${method.name}`);
        console.log(`*********************> Function arguments: ${JSON.stringify(decodedArguments)}\n\n`);
      }

    } else {
      console.error(error);
    }
  });
}


//module.exports = getFunctionNameParams;