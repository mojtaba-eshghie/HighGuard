require('module-alias/register');
const fs = require('fs');
const path = require('path');
const { 
    extractSolcVersion, 
    compileWithVersion, 
    deployContract 
} = require('@lib/web3/deploy');

const projectRoot = path.resolve(__dirname, '..', '..'); 
const contractsDir = path.join(projectRoot, './contracts');

let sourceSource = fs.readFileSync(path.join(contractsDir, 'src', 'CrossSource.sol'), 'utf8');
let tokenSource = fs.readFileSync(path.join(contractsDir, 'src', 'CrossToken.sol'), 'utf8');
let destinationSource = fs.readFileSync(path.join(contractsDir, 'src', 'CrossDestination.sol'), 'utf8');

/**
 * Deploys source, destination and token bridge contracts on the specified 
 * blockchains and initializes event listeners for these contracts to relay
 * transactions between the contracts.
 * 
 * @param {Object} web3A - The Web3 instance for the source chain.
 * @param {Object} envInfoA - An object containing environment information such as accounts, privateKeys, and rpcAddress for the source chain.
 * @param {Object} web3A - The Web3 instance for the destination chain.
 * @param {Object} envInfoB - An object containing environment information such as accounts, privateKeys, and rpcAddress for the destination chain.
 * @returns {Object} An object containing the sourceContract, tokenCrontract and destinationContract instances.
 * @throws {Error} If there's an error during the deployment.
 */
async function deployBridge(web3A, envInfoA, web3B, envInfoB){

    // Deploying the three different contracts
    let sourceSolcVersion = extractSolcVersion(sourceSource);
    let compiledSource = await compileWithVersion(sourceSource, 'CrossSource', sourceSolcVersion);
    let sourceParameters = [];
    let sourceContract = await deployContract(web3A, compiledSource.abi, compiledSource.bytecode, envInfoA, sourceParameters);
    //console.log("source:" + sourceContract._address);

    let tokenSolcVersion = extractSolcVersion(tokenSource);
    let compiledToken = await compileWithVersion(tokenSource, 'CrossToken', tokenSolcVersion);
    let tokenParameters = [];
    let tokenContract = await deployContract(web3B, compiledToken.abi, compiledToken.bytecode, envInfoB, tokenParameters);
    let tokenAddress = tokenContract._address;
    //console.log("token: " + tokenContract._address);

    let destinationSolcVersion = extractSolcVersion(destinationSource);
    let compiledDestination = await compileWithVersion(destinationSource, 'CrossDestination', destinationSolcVersion);
    let destinationParameters = [tokenAddress];
    let destinationContract = await deployContract(web3B, compiledDestination.abi, compiledDestination.bytecode, envInfoB, destinationParameters);
    //console.log("destination: " + destinationContract._address);

    //Giving ownership of minting and burning to destination chain contract
    let receipt0 = await tokenContract.methods.changeOwner(destinationContract._address).send({
        from: web3B.eth.accounts.wallet[0].address,
        gas: 300000,
    });
    if (!receipt0.status){
        throw new Error("Could not give ownership of token to destination contract");
    }

    //Add event listeners to relay transactions
    sourceContract.events.allEvents().on('data', (data) => {
        forwardTransaction(data, sourceContract, destinationContract, web3A, web3B);
    });
    destinationContract.events.allEvents().on('data', (data) => {
        forwardTransaction(data, destinationContract, sourceContract, web3B, web3A);
    });

    return {
        sourceContract: sourceContract,
        tokenContract: tokenContract,
        destinationContract: destinationContract
    };
}

/**
 * Relays an event emitted on one blockchain to another by issuing a transaction on the destination blockchain.
 * 
 * @param {Object} data - An object containing the returnValues of an emitted blockchain event.
 * @param {Object} fromContract - A contract instance of the contract emitting the event.
 * @param {Object} toContract - A contract instance of the contract recieving the cross-chain transaction.
 * @param {Object} fromWeb3 - The Web3 instance for the chain where the contract emitting the event is deployed.
 * @param {Object} toWeb3 - The Web3 instance for the chain where the contract recieving the cross-chain transaction is deployed.
 * @throws {Error} If there's an error during relaying.
 */
async function forwardTransaction(data, fromContract, toContract, fromWeb3, toWeb3){
    let amount = data.returnValues.amount;
    let source = data.returnValues.source;
    let destination = data.returnValues.destination;
    //console.log("Cross chain transaction from " + fromWeb3._provider.url + " to " + toWeb3._provider.url);
    //console.log("Amount, source address, destination address: " + amount, source, destination);
    let receipt = await toContract.methods.fromCrossChain(amount, destination).send({ 
        from: toWeb3.eth.accounts.wallet[0].address,
        gas: 300000 
    });

    if (receipt.status){
        //console.log("Relay sucessful, sending acc");
        await fromContract.methods.crossChainSuccess(amount, source).send({ 
            from: fromWeb3.eth.accounts.wallet[0].address,
            gas: 300000 
        });
    }
    else {
        //console.log("Relay failed, sending acc");
        await fromContract.methods.crossChainFailure(amount, source).send({ 
            from: fromWeb3.eth.accounts.wallet[0].address,
            gas: 300000 
        });
    }
    //console.log("Finalized cross chain transaction");
}

module.exports = deployBridge;