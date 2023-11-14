require('module-alias/register');
const Monitor = require('@monitor/monitor');
const setupAnvilEnv = require('@envs/anvil');
const setupEnv = require('@envs/anvil');
const fs = require('fs');
const path = require('path');
const { readModelFunctionsParams } = require('@lib/config');
const { getActivities } = require('@lib/dcr/info')
const { 
    extractSolcVersion, 
    compileWithVersion, 
    deployContract,
    getContractABI 
} = require('@lib/web3/deploy');

const projectRoot = path.resolve(__dirname, '..'); 
const contractsDir = path.join(projectRoot, './contracts');
let HelloWorldSource = fs.readFileSync(path.join(contractsDir, 'src', 'HelloWorld.sol'), 'utf8');


async function prepareContract(web3, envInfo) {
    let solcVersion = extractSolcVersion(HelloWorldSource);
    let { abi, bytecode } = await compileWithVersion(HelloWorldSource, "HelloWorld", solcVersion);
    let parameters = [5];
    let contractInstance = await deployContract(web3, abi, bytecode, envInfo, parameters);
    return contractInstance;
}

setupAnvilEnv().then(async env => {
    envInfo = env['envInfo'];
    web3 = env['web3'];

    let contractInstance = await prepareContract(web3, envInfo);
    // console.log('Deployed contract address:', contractInstance._address);
    let modelFunctionParams = readModelFunctionsParams("HelloWorld", "1702173")

    configs = {
        web3: web3,
        contractAddress: contractInstance._address,
        contractFileName: "HelloWorld",
        contractName: "HelloWorld",
        contractABI: await getContractABI("HelloWorld"),
        modelFunctionParams: modelFunctionParams,
        activities: await getActivities("1702173"),
        modelId: "1702173"
    }

    let monitor = new Monitor(configs);

    console.log(envInfo);
    console.log(`Monitoring the contract: ${contractInstance._address}`)
    monitor.start();

}).catch(error => {
    console.error('An error occurred:', error);
});