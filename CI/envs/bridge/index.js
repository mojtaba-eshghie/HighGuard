require('module-alias/register');
const fs = require('fs');
const path = require('path');
const { 
    extractSolcVersion, 
    compileWithVersion, 
    deployContract 
} = require('@lib/web3/deploy');

const projectRoot = path.resolve(__dirname, '..', '..', '..'); 
const contractsDir = path.join(projectRoot, 'contracts', 'src', 'cross-chain');

let tokenSource = fs.readFileSync(path.join(contractsDir, 'CrossToken.sol'), 'utf8');
let routerSource = fs.readFileSync(path.join(contractsDir, 'Router.sol'), 'utf8');
let vaultSource = fs.readFileSync(path.join(contractsDir, 'Vault.sol'), 'utf8');

const blockchains = new Map();
const assetDollarValue = new Map([
    ["ETH", 0.5],
    ["AVAX", 0.2]
]);

/**
 * Deploys router, vault and token bridge contracts on the specified 
 * blockchain and initializes an event listener for these contracts to relay
 * transactions between the contracts.
 * 
 * @param {Object} web3 - The Web3 instance for the blockchain.
 * @param {Object} envInfo - An object containing environment information such as accounts, privateKeys, and rpcAddress for the blockchain.
 * @param {string} name - A string containing the name of the blockchain
 * @param {string} nativeToken - A string containing the name of the native cryptocurrency of the chain, ex: ETH for ethereum, AVAX for avalanche
 * @returns {Object} An object containing the sourceContract, tokenCrontract and destinationContract instances.
 * @throws {Error} If there's an error during the deployment.
 */
async function deployBridge(web3, envInfo, name, nativeToken){

    //Deploy tokens
    let tokenSolcVersion = extractSolcVersion(tokenSource);
    let compiledToken = await compileWithVersion(tokenSource, 'CrossToken', 'CrossToken', tokenSolcVersion);
    let tokenParameters = [];
    let tokenContract = await deployContract(web3, compiledToken.abi, compiledToken.bytecode, envInfo, tokenParameters);

    //Deploy Router contracts
    let routerSolcVersion = extractSolcVersion(routerSource);
    let compiledRouter = await compileWithVersion(routerSource, 'Router', 'Router', routerSolcVersion);
    let routerParameters = [tokenContract._address];
    let routerContract = await deployContract(web3, compiledRouter.abi, compiledRouter.bytecode, envInfo, routerParameters);

    //Deploy vault contracts
    let vaultSolcVersion = extractSolcVersion(vaultSource);
    let compiledVault = await compileWithVersion(vaultSource, 'Vault', 'Vault', vaultSolcVersion);
    let vaultParameters = [routerContract._address];
    let vaultContract = await deployContract(web3, compiledVault.abi, compiledVault.bytecode, envInfo, vaultParameters);

    blockchains.set(name, {
        name: name,
        web3: web3,
        nativeToken: nativeToken,
        envInfo: envInfo,
        vault: vaultContract,
        signer: web3.eth.accounts.wallet[0].address
    });

    assetDollarValue.set(tokenContract._address, 1.0);
    /* //Giving ownership of minting and burning to destination chain contract
    let receipt0 = await tokenContract.methods.changeOwner(destinationContract._address).send({
        from: web3B.eth.accounts.wallet[0].address,
        gas: 300000,
    });
    if (!receipt0.status){
        throw new Error("Could not give ownership of token to destination contract");
    } */

    //Add event listeners to relay transactions
    routerContract.events.allEvents().on('data', (data) => {
        handleEvent(data, name);
    });

    return {
        token: tokenContract,
        router: routerContract,
        vault: vaultContract
    };
}

/**
 * Parses a memo string emitted by an event.
 * 
 * @param {string} memo - A string containing the memo of an event, example: SWAP:ETH.ETH:0x21312...
 * @returns {Object} An object containing the operation, chain and destination address and asset address the event regards.
 * @throws {Error} If there's an error during parsing.
 */
function parseMemo(memo){
    let array = memo.split(':');
    let operation = array[0];
    let temp = array[1].split('.');
    let chain = temp[0];
    let asset = temp[1];
    let destaddr = array[2];

    return {
        operation: operation,
        chain: chain,
        asset: asset,
        destaddr: destaddr
    }
}

/**
 * Handles an event emitted on a relay contract.
 * 
 * @param {Object} data - An object containing the returnValues of an emitted blockchain event.
 * @param {string} name - The name of the blockchain that emitted the event
 * @throws {Error} If there's an error during relaying.
 */
async function handleEvent(data, name){
    console.log("Event on chain: " + name);
    switch(data.event) {
        case "Deposit":
            console.log("Deposit: " + data.returnValues.memo);
            await deposit(data, name);
            break;
        case "PayOut":  //no handling necessary, payout has happened
            console.log("PayOut: " + data.returnValues.memo);
            break;
        default:
            console.log("Unexpected Event");
    }
}

//Handles all calls of the deposit function of the router contract, currently supports swap and add.
async function deposit(data, name){
    let memo = parseMemo(data.returnValues.memo);

    let target = blockchains.get(memo.chain);
    try {
        if(target){ //If blockchain exists
            switch(memo.operation){
                case "=":
                case "SWAP":
                    //If 0x0 token, represent it as the name of the native token, eg. ETH or AVAX
                    let sourceAsset = data.returnValues.asset == "0x0000000000000000000000000000000000000000" ? blockchains.get(name).nativeToken : data.returnValues.asset;
                    //If native token, represent as 0x0
                    let targetToken = memo.asset == target.nativeToken ? "0x0000000000000000000000000000000000000000" : memo.asset;
                    let amount = getExchange(sourceAsset, memo.asset, data.returnValues.amount);
                    let receipt = await target.vault.methods.bridgeForwards(memo.destaddr, targetToken, amount, "OUT:" + memo.destaddr).send({
                        from: target.signer,
                        gas: 300000,
                    });
                    if(receipt.status){
                        return;
                    }
                    break;
                case "ADD": //Liquidity was added to the vault, no relaying necessary
                    return;
                default:
                    break;
            }
        }
    } catch (error) {
        console.log(error);
        console.log("Could not relay transaction");
    }
    //If above section did not return, refund the transaction, could implement some kind of fee to stop spamming
    target = blockchains.get(name);
    let receipt = await target.vault.methods.bridgeForwards(data.returnValues.from, data.returnValues.asset, data.returnValues.amount, "REFUND:" + data.returnValues.from).send({
        from: target.signer,
        gas: 300000,
    });
}

/**
 * Calculates how many targetAssets the paid sourceAssets correspond to.
 * 
 * @param {string} sourceAsset - A string containing the address (or label in case of native cryptocurrency) of the asset being paid.
 * @param {string} targetAsset - A string containing the address (or label in case of native cryptocurrency) of the desired asset to swap for.
 * @param {Number} amount - The amount of sourceAssets being paid
 * @returns the amount of targetAssets
 */
function getExchange(sourceAsset, targetAsset, amount){
    let sourceDollarValue = assetDollarValue.get(sourceAsset);
    let targetDollarValue = assetDollarValue.get(targetAsset);
    if (sourceDollarValue && targetDollarValue){
        return Math.floor((sourceDollarValue * amount)/targetDollarValue); //If we want to have a fee for conversion, put it here
    }
    return 0;
}

module.exports = deployBridge;