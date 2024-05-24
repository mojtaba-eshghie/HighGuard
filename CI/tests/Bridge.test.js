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

async function sequence(contractsA, contractsB, web3A, web3B){

    let tokenA = contractsA.token;
    let vaultA = contractsA.vault;
    let routerA = contractsA.router;

    let tokenB = contractsB.token;
    let vaultB = contractsB.vault;
    let routerB = contractsB.router;

    let accountA = web3A.eth.accounts.wallet[0].address;
    let accountB = web3B.eth.accounts.wallet[0].address;
    console.log(vaultA._address);

    /* let fundTarget = await vaultB.methods.fund().send({
        from: accountB,
        gas: 300000,
        value: 100000
    });
    if(!fundTarget.status){
        console.log(fundTarget);
    } */
    //Crypto test
    let fundTarget = await routerB.methods.deposit(vaultB._address, "0x0000000000000000000000000000000000000000", 0, "ADD:B.AVAX:_").send({
        from: accountB,
        gas: 300000,
        value: 100000
    });
    if(!fundTarget.status){
        console.log(fundTarget);
    }
    

    let balance = await web3B.eth.getBalance(vaultB._address); 
    console.log(balance);

    let receipt1 = await routerA.methods.deposit(vaultA._address, "0x0000000000000000000000000000000000000000", 0, "SWAP:B.AVAX:" + accountB).send({
        from: accountA,
        gas: 300000,
        value: 100
    });

    await sleep(5000);

    let balance2 = await web3B.eth.getBalance(vaultB._address); 
    console.log(balance2);
    
    //ERC20 TEST
    let getTokens = await tokenA.methods.testToken(200).send({
        from: accountA,
        gas: 300000,
    });
    if(!getTokens.status){
        console.log(getTokens);
    }

    let approve = await tokenA.methods.approve(routerA._address, 150).send({
        from: accountA,
        gas: 300000,
    });

    let fundERC = await routerA.methods.deposit(vaultA._address, tokenA._address, 150, "ADD:A." + tokenA._address + ":_").send({
        from: accountA,
        gas: 300000,
    });
    if(!fundERC.status){
        console.log(fundERC);
    }

    let tokenBalanceUser = await tokenA.methods.balanceOf(accountA).call();
    console.log(tokenBalanceUser);
    let tokenBalanceRouter = await tokenA.methods.balanceOf(routerA._address).call();
    console.log(tokenBalanceRouter);
    
    //200 avax should be 40 erc20 withdrawn
    let avaxToERC = await routerB.methods.deposit(vaultB._address, "0x0000000000000000000000000000000000000000", 0, "SWAP:A."+ tokenA._address +":" + accountA).send({
        from: accountB,
        gas: 300000,
        value: 200
    });

    let newTokenBalanceUser = await tokenA.methods.balanceOf(accountA).call();
    console.log(newTokenBalanceUser);
    let newTokenBalanceRouter = await tokenA.methods.balanceOf(routerA._address).call();
    console.log(newTokenBalanceRouter);
}

async function callSmartContract(method, sender, value = 0){
    let receipt = await method.send({
        from: sender,
        gas: 300000,
        value: value
    });
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

    let contractsA = await deployBridge(envAnvil.web3, envAnvil.envInfo, 'A', 'ETH');
    let contractsB = await deployBridge(envAvalanche.web3, envAvalanche.envInfo, 'B', 'AVAX');
    console.log("Bridge deployed");
    //console.log(envAnvil.web3);
    //let contracts = await deployBridge(envAnvil.web3, envAnvil.envInfo, envAvalanche.web3, envAvalanche.envInfo);
    bridgeTestLogger.debug("Executing sequence");
    let execution = await sequence(contractsA, contractsB, envAnvil.web3, envAvalanche.web3);
    bridgeTestLogger.debug("Done");


}

startUp();