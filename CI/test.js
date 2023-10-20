const axios = require('axios');

async function getSolcVersions() {
    try {
        const response = await axios.get('https://solc-bin.ethereum.org/bin/list.json');
        const solcVersions = response.data;

        console.log("Available remote versions:");
        console.log(solcVersions.releases);
    } catch (error) {
        console.error("Error fetching versions:", error);
    }
}

getSolcVersions();
