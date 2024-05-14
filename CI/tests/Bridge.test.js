require('module-alias/register');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const chalk = require('chalk');
const { 
    extractSolcVersion, 
    compileWithVersion, 
    deployContract 
} = require('@lib/web3/deploy');
const setupAvalancheEnv = require('@envs/avalanche-subnet');
const setupAnvilEnv = require('@envs/anvil');
const deployBridge = require('@envs/bridge');
const { sleep } = require('@lib/os/process');

const getLogger = require('@lib/logging/logger').getLogger;
const bridgeTestLogger = getLogger('bridgetest');

async function sequence(sourceContract, tokenContract, destinationContract, web3A, web3B) {
    bridgeTestLogger.debug(`Called: sequence...`);
    let sourceAccount = web3A.eth.accounts.wallet[0].address;
    let destinationAccount = web3B.eth.accounts.wallet[0].address;

    //Source account deposit 100 wei into source contract
    let receipt1 = await sourceContract.methods.deposit().send({
        from: sourceAccount,
        gas: 300000,
        value: 100
    });
    bridgeTestLogger.debug(`Transaction receipt 1: ${JSON.stringify(receipt1)}`);
    if (!receipt1.status) {
        console.error(receipt1);
    }
    //Ensure that 100 wei in balance for source account
    let receipt2 = await sourceContract.methods.balance(sourceAccount).call();
    bridgeTestLogger.debug(`Transaction receipt 2: ${JSON.stringify(receipt2)}`);
    if (receipt2 != 100) {
        console.error(receipt2);
    }
    //Initiate cross chain transfer of 25 wei
    let receipt3 = await sourceContract.methods.toCrossChain(25, destinationAccount).send({
        from: sourceAccount,
        gas: 300000,
    });
    bridgeTestLogger.debug(`Transaction receipt 3: ${JSON.stringify(receipt3)}`);
    if (!receipt3.status) {
        console.error(receipt3);
    }

    //Wait for relay
    await sleep(5000);

    //Ensure that 75 wei remains in source balance
    let receipt4 = await sourceContract.methods.balance(sourceAccount).call();
    bridgeTestLogger.debug(`Transaction receipt 4: ${JSON.stringify(receipt4)}`);
    if (receipt4 != 75) {
        console.error(receipt4);
    }
    //Ensure 25 wei in destination balance
    let receipt5 = await destinationContract.methods.balance(destinationAccount).call();
    bridgeTestLogger.debug(`Transaction receipt 5: ${JSON.stringify(receipt5)}`);
    if (receipt5 != 25){
        console.error(receipt5);
    }
    //Withdraw 20 Wei on destination
    let receipt6 = await destinationContract.methods.withdraw(20).send({
        from: destinationAccount,
        gas: 300000,
    });
    bridgeTestLogger.debug(`Transaction receipt 6: ${JSON.stringify(receipt6)}`);
    if (!receipt6.status){
        console.error(receipt6);
    }

    //Ensure 5 wei in balance on destination
    let receipt7 = await destinationContract.methods.balance(destinationAccount).call();
    bridgeTestLogger.debug(`Transaction receipt 7: ${JSON.stringify(receipt7)}`);
    if (receipt7 != 5){
        console.error(receipt7);
    }

    //Ensure receiver has 20 wei
    let receipt8 = await tokenContract.methods.balanceOf(destinationAccount).call();
    bridgeTestLogger.debug(`Transaction receipt 8: ${JSON.stringify(receipt8)}`);

    if (receipt8 != 20){
        console.error(receipt8);
    }

    //Ensure destination contract has 5 wei
    let receipt9 = await tokenContract.methods.balanceOf(destinationContract._address).call();
    bridgeTestLogger.debug(`Transaction receipt 9: ${JSON.stringify(receipt9)}`);
    if (receipt9 != 5){
        console.error(receipt9);
    }

    //Allow sending of 15 tokens from 'reciever' to destination contract (deposit)
    let receipt10 = await tokenContract.methods.approve(destinationContract._address, 15).send({
        from: destinationAccount,
        gas: 300000,
    });
    bridgeTestLogger.debug(`Transaction receipt 10: ${JSON.stringify(receipt10)}`);
    if (!receipt10.status){
        console.error(receipt10);
    }

    //Deposit 15 tokens into destination contract
    let receipt11 = await destinationContract.methods.deposit(15).send({
        from: destinationAccount,
        gas: 300000,
    });
    bridgeTestLogger.debug(`Transaction receipt 11: ${JSON.stringify(receipt11)}`);
    if (!receipt11.status){
        console.error(receipt11);
    }
    
    //Initiate cross chain transfer of 20 wei
    let receipt12 = await destinationContract.methods.toCrossChain(20, sourceAccount).send({
        from: destinationAccount,
        gas: 300000,
    });
    bridgeTestLogger.debug(`Transaction receipt 12: ${JSON.stringify(receipt12)}`);
    if (!receipt12.status){
        console.error(receipt12);
    }

    //Wait for relay
    await sleep(5000);

    //Ensure that 95 wei remains in balance on source chain
    let receipt13 = await sourceContract.methods.balance(sourceAccount).call();
    bridgeTestLogger.debug(`Transaction receipt 13: ${JSON.stringify(receipt13)}`);
    if (receipt13 != 95) {
        console.error(receipt13);
    }

}



async function startUp() {
    bridgeTestLogger.debug("Starting Anvil...");
    let envAnvil = await setupAnvilEnv();
    bridgeTestLogger.debug("Finished running Anvil...");

    bridgeTestLogger.debug("Starting Avalanche...");
    let envAvalanche = await setupAvalancheEnv(); //change to avalanche
    bridgeTestLogger.debug("Finished running Avalanche");

    bridgeTestLogger.debug("Web3 A: " + envAnvil.envInfo.rpcAddress);
    bridgeTestLogger.debug("Web3 B: " + envAvalanche.envInfo.rpcAddress);

    
    //console.log(envAnvil.web3);
    let contracts = await deployBridge(envAnvil.web3, envAnvil.envInfo, envAvalanche.web3, envAvalanche.envInfo);
    bridgeTestLogger.debug("Executing sequence");
    let execution = await sequence(contracts.sourceContract, contracts.tokenContract, contracts.destinationContract, envAnvil.web3, envAvalanche.web3);
    bridgeTestLogger.debug("Done");


}

startUp();