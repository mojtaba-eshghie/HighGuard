## Clawk: Monitoring Business Processes in Smart Contracts 
Clawk is Acronym for Contract Law Keeper, read "clock".


## Installation
The ecosystem is tested with: 

|       | Server | Client |
|-------|----------|----------|
| **Node** |  v16.20.2  | v18.17.1   |
| **NPM** | 8.19.4   | 9.6.7   |


Run the `npm install` in the main repository directory and the following directories:

`server/monitor`

`client`


## Usage

### Using Clawk in Client-Server Mode
Run the following commands (in order):

In **server**:

`npm start`

The server will ask for your DCRGraphs credentials the first time you run it. The credentials will be stored under `server/monitor/datastore/` directory as a sqlite database.

In **client**:

`npm start`

Go to the following address in your browser (or alternatives that were used if port 3001 is unavailable), and use the monitor web interface:
[http://localhost:3000](http://localhost:3001)

Fill the forms inputs from top to down for it to work properly. 

### Using Clawk Standalone CLI Monitor
Run the following CLI command using the options in the table below:
```sh
node server/monitor/monitorCLI.js
```
Use the following options with the Clawk Standalone CLI Monitor:

| Option        | Description   | Type    | Required |
|---------------|---------------|---------|----------|
| `--help`      | Show help     | boolean | No       |
| `--version`   | Show version number | boolean | No       |
| `--address`   | The address of the deployed contract | string  | Yes      |
| `--dcrID`     | The DCR model identifier from DCRGraphs.net website | string  | Yes      |
| `--simID`     | The identifier of the specific simulation you want to model this contract against. This identifier is retrievable by going to address [https://repository.dcrgraphs.net/api/graphs/${dcrID}/sims/](https://repository.dcrgraphs.net/api/graphs/${dcrID}/sims/) replacing ${dcrID} with the ID of the model you are trying to monitor against | string  | Yes      |
| `--ABIFileName` | The name of the contract ABI file (for example: PiggyBank.json) | string  | Yes      |
| `--contract`  | The contract parameter | string  | Yes      |


## Cite Us
```
@misc{Clawk,
  title = {Mojtaba-Eshghie/{{CLawK}}},
  author = {Eshghie, Mojtaba},
  year = {2023},
  month = sep,
  urldate = {2023-09-16},
  abstract = {CLawK is a Runtime Monitoring Tool for Business Process-Level Smart Contract Properties},
  copyright = {MIT},
  keywords = {dcr-graphs,dynamic-condition-response,runtime-monitoring,runtime-verification,smart-contract-specifications,smart-contracts-security}
}
```

## Screenshot of the tool web interface (client)
![CLawK Screenshot](https://raw.githubusercontent.com/mojtaba-eshghie/CLawK/main/client/public/Screenshot%202023-06-21%20at%2016.32.03.png)

