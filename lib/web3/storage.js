let fs = require('fs');
let path = require('path');

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

let getContractStorageVariableValue = async (contract, contractAddress, variableIdentifier) => {
        let storageLayout = JSON.parse(fs.readFileSync(path.join(__dirname,'../contracts/storageLayouts/') + contract + '.json'));
        const variableDetails = storageLayout.storage.find(v => v.label === variableIdentifier);
        if (!variableDetails) {
        console.error(`Variable "${variableIdentifier}" not found in the storage layout`);
        return;
        }
        const storageSlotIndex = variableDetails.slot;
        let web3 = connectWeb3();
        // Get the variable value
        return await web3.eth.getStorageAt(contractAddress, storageSlotIndex)
        .then((result) => {
            result = result.replace(/^0x0*/, '0x');
            return result;
        })
        .catch((error) => {
            console.error('Error fetching variable value:', error);
            return -1;
        });
}
  
  
module.exports = {
    getFunctionNameParams,
    getContractStorageVariableValue,
};