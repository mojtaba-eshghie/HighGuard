let WaitQueue = require('wait-queue');
let Web3 = require("web3");
let fs = require('fs');
let path = require('path');


let getDCRMethodsToExecute = () => {
    //console.log(`Transaction object: ${JSON.stringify(tx)}`);

    // Get the function signature from the transaction data
    const signature = tx.input.slice(0, 10);

    // Find the function ABI that matches the signature
    const method = JSON.parse(contractABI).find((m) => m.type === 'function' && `0x${web3.utils.keccak256(m.name + '(' + m.inputs.map((i) => i.type).join(',') + ')').slice(2, 10)}` === signature);
    const decodedParams = web3.eth.abi.decodeParameters(method.inputs, tx.input.slice(10));
    
    console.log(`Method is: ${method.name}`)
    console.log(`Activities are: ${activities}`);
    
    const checkParametersAreInParamaps = () => {
        const relevantKeys = Object.keys(decodedParams).filter(key => !key.match(/^(\d+|__length__)$/));
        return relevantKeys.filter(key => Object.hasOwnProperty.call(paramaps, key));
    };
    
    // Assumption:
    // If the event does not exist in the DCR model, just skip it
    if (activities.includes(method.name) || checkParametersAreInParamaps()) { 
        try {
        checkParametersAreInParamaps().forEach(parameter => {
            // convert tx parameter to value suitable for DCR
            if ((paramaps[parameter][method.name]["EVMType"] === "uint256") && (paramaps[parameter][method.name]["DCRType"] === "duration")) {
            // Conversion between time parameters in SC to time in DCR
            let unit = paramaps[parameter][method.name]["EVMUnit"];
            let value = decodedParams[parameter];
            
            const convertToISO8601 = (value, unit) => {
                switch (unit) {
                    case "hours":
                        return 'PT' + value + 'H';
                    case "minutes":
                        return 'PT' + value + 'M';
                    case "seconds":
                        return 'PT' + value + 'S';
                    default:
                        return "Invalid unit";
                }
            };
            
            // DCR event types for REST API are: int, duration, ...
            let iso8601Duration = convertToISO8601(value, unit);
            let tx_ = {
                'dcrID': parameter,
                'contractABI': contractABI, 
                'dcrValue': iso8601Duration,
                'dcrType': paramaps[parameter][method.name]["DCRType"]
            };
            contract_queue.push(tx_);
            }

            
        });
        } catch {
        console.log("TX conversion failed");
        }
        if (activities.includes(method.name)) {
        let tx_ = {
            'dcrID': method.name,
            'contractABI': contractABI, 
            'dcrValue': null,
            'dcrType': null
        };
        contract_queue.push(tx_);
        }


        console.log(`method is: ${method.name}`);

    }
}


module.exports = getDCRMethodsToExecute;